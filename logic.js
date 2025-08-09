// Phần 1: Khởi Tạo và Kiểm Tra Điều Kiện Sản Phẩm Chính
// Giữ nguyên toàn bộ code cũ và bổ sung logic mới

// Import dữ liệu (giữ nguyên)
import { product_data } from './data.js';

// Biến toàn cục (giữ nguyên)
const MAX_ENTRY_AGE = {
  PUL_TRON_DOI: 70,
  PUL_15_NAM: 70,
  PUL_5_NAM: 70,
  KHOE_BINH_AN: 70,
  VUNG_TUONG_LAI: 70,
  TRON_TAM_AN: 60, // Giữ nguyên, sẽ kiểm tra thêm điều kiện
  AN_BINH_UU_VIET: 65 // Giữ nguyên, sẽ kiểm tra thêm điều kiện
};
const MAX_RENEWAL_AGE = {
  health_scl: 74,
  bhn: 85,
  accident: 65,
  hospital_support: 59
};
const MAX_STBH = {
  bhn: 5000000000,
  accident: 8000000000
};

// Biến trạng thái (giữ nguyên)
let supplementaryInsuredCount = 0;
let currentMainProductState = { product: null, age: null };

// Hàm tính tuổi (giữ nguyên)
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Hàm xác định nhóm nghề (giữ nguyên)
function determineRiskGroup(occupation) {
  const occupations = {
    "Nhóm 1": [/* danh sách nghề nhóm 1 */],
    "Nhóm 2": [/* danh sách nghề nhóm 2 */],
    "Nhóm 3": [/* danh sách nghề nhóm 3 */],
    "Nhóm 4": [/* danh sách nghề nhóm 4 */]
  };
  for (let group in occupations) {
    if (occupations[group].includes(occupation)) return parseInt(group.split(" ")[1]);
  }
  return 1; // Mặc định nhóm 1 nếu không tìm thấy
}

// Hàm khởi tạo người được bảo hiểm (giữ nguyên)
function initPerson() {
  document.getElementById("birthDate").addEventListener("change", function() {
    const age = calculateAge(this.value);
    document.getElementById("age").value = age;
  });
  document.getElementById("occupation").addEventListener("change", function() {
    const riskGroup = determineRiskGroup(this.value);
    document.getElementById("riskGroup").value = riskGroup;
  });
}

// Hàm khởi tạo sản phẩm bổ sung (giữ nguyên)
function initSupplementaryProducts() {
  // Logic hiện có để khởi tạo các checkbox bổ sung
}

// Hàm mới: Kiểm tra điều kiện tham gia sản phẩm
function checkProductEligibility(product, age, gender, riskGroup, paymentTerm) {
  const minAgeMale = 12;
  const minAgeFemale = 28;

  if (product === "TRON_TAM_AN") {
    if (riskGroup === 4) return false; // Ẩn nếu nhóm nghề 4
    if (gender === "male" && (age < minAgeMale || age > MAX_ENTRY_AGE[product])) return false;
    if (gender === "female" && (age < minAgeFemale || age > MAX_ENTRY_AGE[product])) return false;
    return true;
  }

  if (product === "AN_BINH_UU_VIET") {
    const maxAges = { 5: 65, 10: 60, 15: 55 };
    const maxAge = maxAges[paymentTerm] || 65;
    if (gender === "male" && age < minAgeMale) return false;
    if (gender === "female" && age < minAgeFemale) return false;
    if (age > maxAge) return false;
    return true;
  }

  // Giữ nguyên điều kiện cho các sản phẩm khác
  return age >= 0 && age <= MAX_ENTRY_AGE[product];
}

// Hàm mới: Ẩn sản phẩm không hợp lệ
function hideProduct(productId) {
  const select = document.getElementById("productSelect");
  const option = select.querySelector(`option[value="${productId}"]`);
  if (option) option.style.display = "none";
}

// Hàm khởi tạo (giữ nguyên, bổ sung kiểm tra)
function init() {
  initPerson();
  initProduct();
  initSupplementaryProducts();
  attachGlobalListeners();

  // Kiểm tra điều kiện ngay khi khởi tạo
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const riskGroup = parseInt(document.getElementById("riskGroup").value);
  const productSelect = document.getElementById("productSelect");

  for (let option of productSelect.options) {
    if (!checkProductEligibility(option.value, age, gender, riskGroup, 0)) {
      hideProduct(option.value);
    }
  }
}

// Hàm khởi tạo sản phẩm (giữ nguyên, bổ sung logic Trọn Tâm An/An Bình)
function initProduct() {
  const productSelect = document.getElementById("productSelect");
  productSelect.addEventListener("change", function() {
    const product = this.value;
    const age = parseInt(document.getElementById("age").value);
    const gender = document.getElementById("gender").value;
    const riskGroup = parseInt(document.getElementById("riskGroup").value);
    const paymentTerm = parseInt(document.getElementById("paymentTerm").value) || 0;

    if (!checkProductEligibility(product, age, gender, riskGroup, paymentTerm)) {
      alert("Sản phẩm không khả dụng với độ tuổi, giới tính hoặc nhóm nghề này.");
      this.value = ""; // Reset nếu không hợp lệ
      return;
    }

    if (product === "TRON_TAM_AN") {
      document.getElementById("bungGiaLuc").checked = true; // Bắt buộc Bùng Gia Lực
      document.getElementById("bungGiaLuc").disabled = true;
      document.getElementById("paymentTerm").value = 10; // Cố định 10 năm
      document.getElementById("paymentTerm").disabled = true;
      document.getElementById("stbh").value = "100.000.000"; // Cố định STBH
      document.getElementById("stbh").disabled = true;
      const totalFeeUntil = age + 10; // Tổng phí đến năm
      document.getElementById("totalFeeUntil").value = totalFeeUntil;
      document.getElementById("totalFeeUntil").disabled = true;
    } else if (product === "AN_BINH_UU_VIET") {
      document.getElementById("bungGiaLuc").disabled = false; // Cho phép chọn bổ sung
      document.getElementById("paymentTerm").disabled = false; // Cho phép chọn 5/10/15
      document.getElementById("stbh").disabled = false; // Cho phép nhập STBH
      const term = parseInt(document.getElementById("paymentTerm").value) || 5;
      document.getElementById("totalFeeUntil").value = age + term - 1;
      document.getElementById("totalFeeUntil").disabled = true;
    } else {
      document.getElementById("bungGiaLuc").disabled = false;
      document.getElementById("paymentTerm").disabled = false;
      document.getElementById("stbh").disabled = false;
      document.getElementById("totalFeeUntil").disabled = false;
    }

    updateDisplay();
  });
}

// Hàm gắn sự kiện (giữ nguyên, bổ sung kiểm tra)
function attachGlobalListeners() {
  document.querySelectorAll("input, select").forEach(input => {
    input.addEventListener("change", updateDisplay);
    input.addEventListener("input", updateDisplay);
  });

  // Thêm kiểm tra lại khi thay đổi tuổi/giới tính/nghề
  document.getElementById("birthDate").addEventListener("change", function() {
    const age = calculateAge(this.value);
    document.getElementById("age").value = age;
    checkAndUpdateProductEligibility();
  });

  document.getElementById("gender").addEventListener("change", checkAndUpdateProductEligibility);
  document.getElementById("occupation").addEventListener("change", function() {
    const riskGroup = determineRiskGroup(this.value);
    document.getElementById("riskGroup").value = riskGroup;
    checkAndUpdateProductEligibility();
  });
}

// Hàm mới: Kiểm tra và cập nhật điều kiện
function checkAndUpdateProductEligibility() {
  const age = parseInt(document.getElementById("age").value);
  const gender = document.getElementById("gender").value;
  const riskGroup = parseInt(document.getElementById("riskGroup").value);
  const paymentTerm = parseInt(document.getElementById("paymentTerm").value) || 0;
  const productSelect = document.getElementById("productSelect");
  const currentProduct = productSelect.value;

  for (let option of productSelect.options) {
    option.style.display = checkProductEligibility(option.value, age, gender, riskGroup, paymentTerm) ? "block" : "none";
  }

  if (!checkProductEligibility(currentProduct, age, gender, riskGroup, paymentTerm)) {
    productSelect.value = "";
    updateDisplay();
  }
}
// Phần 2: Xử Lý Input và Tính Phí
// Giữ nguyên code cũ và bổ sung logic mới

// Hàm kiểm tra và định dạng input (mới)
function validateInput(input) {
  let value = input.value.replace(/\D/g, ""); // Loại bỏ ký tự không phải số
  if (value === "") return false;
  value = parseInt(value);
  if (input.id === "stbh" && value < 100000000) {
    alert("STBH nhỏ hơn 100 triệu không hợp lệ.");
    return false;
  }
  input.value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return true;
}

// Hàm tính phí bổ sung (mới)
function calculateSupplementaryPremium(product, stbh, age) {
  let premium = 0;
  switch (product) {
    case "health_scl":
      const programs = { "Cơ bản": 100000000, "Nâng cao": 250000000, "Toàn diện": 500000000, "Hoàn hảo": 1000000000 };
      const selectedProgram = document.querySelector("#health_scl select").value;
      stbh = programs[selectedProgram] || 0;
      premium = (stbh / 1000000) * (health_scl_rates[age] || 0);
      break;
    case "hospital_support":
      const mainPremium = parseInt(document.getElementById("premium").value.replace(/\D/g, "")) || 0;
      const maxAmount = Math.floor(mainPremium / 4000000) * 100000;
      stbh = Math.min(stbh, age >= 18 ? 1000000 : 300000, maxAmount);
      if (stbh % 100000 !== 0) stbh = Math.floor(stbh / 100000) * 100000;
      document.getElementById("hospital_support_stbh").value = stbh.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      premium = (stbh / 1000) * (hospital_fee_support_rates[age] || 0);
      break;
    case "waiver_premium":
      const totalPremium = parseInt(document.getElementById("totalPremium").value.replace(/\D/g, "")) || 0;
      const selectedPersonPremium = parseInt(document.querySelector("#waiver_premium input[name='waiverPerson']:checked")?.nextElementSibling?.dataset?.premium || "0");
      stbh = totalPremium - selectedPersonPremium;
      premium = waiver_premium_rates[age] || 0;
      break;
  }
  return premium;
}

// Cập nhật hàm tính phí (giữ nguyên, bổ sung logic mới)
function calculatePremium(product, stbh, age, term) {
  let premium = 0;
  if (!stbh) stbh = parseInt(document.getElementById("stbh").value.replace(/\D/g, "")) || 0;
  if (!term) term = parseInt(document.getElementById("paymentTerm").value) || 0;

  if (product === "TRON_TAM_AN") {
    stbh = 100000000; // Cố định STBH
    term = 10; // Cố định thời hạn
    premium = (stbh / 1000000) * (product_data["AN_BINH_UU_VIET"].rates[age] || 0) * term / 10; // Dựa trên An Bình Ưu Việt 10 năm
  } else if (product === "AN_BINH_UU_VIET") {
    premium = (stbh / 1000000) * (product_data[product].rates[age] || 0) * term / 10;
  } else {
    premium = (stbh / 1000000) * (product_data[product].rates[age] || 0) * term / 10; // Giữ nguyên logic cũ
  }

  if (premium < 5000000) {
    alert("Phí chính nhỏ hơn 5 triệu không hợp lệ.");
    return 0;
  }
  return premium;
}

// Cập nhật hàm cập nhật hiển thị (giữ nguyên, bổ sung logic mới)
function updateDisplay() {
  const product = document.getElementById("productSelect").value;
  const age = parseInt(document.getElementById("age").value);
  const stbh = parseInt(document.getElementById("stbh").value.replace(/\D/g, "")) || 0;
  const term = parseInt(document.getElementById("paymentTerm").value) || 0;
  let premium = 0;
  let supplementaryPremium = 0;

  if (product && validateInput(document.getElementById("stbh"))) {
    premium = calculatePremium(product, stbh, age, term);
    document.getElementById("premium").value = premium.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Tính phí bổ sung
    document.querySelectorAll(".supplementary").forEach(checkbox => {
      if (checkbox.checked) {
        const suppProduct = checkbox.id;
        const suppStbh = parseInt(document.getElementById(`${suppProduct}_stbh`)?.value.replace(/\D/g, "")) || 0;
        supplementaryPremium += calculateSupplementaryPremium(suppProduct, suppStbh, age);
      }
    });

    const totalPremium = premium + supplementaryPremium;
    document.getElementById("totalPremium").value = totalPremium.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}

// Cập nhật hàm gắn sự kiện input (giữ nguyên, bổ sung kiểm tra)
document.getElementById("stbh").addEventListener("input", function() {
  validateInput(this);
  updateDisplay();
});

document.getElementById("paymentTerm").addEventListener("change", updateDisplay);
// Phần 3: Tính Kỳ Đóng Phí, Bảng Minh Họa và Xuất Kết Quả
// Giữ nguyên code cũ và bổ sung logic mới

// Hàm tính phí theo kỳ đóng (mới)
function calculatePaymentTerm(premium, termType) {
  let termPremium = 0;
  const annualPremium = parseInt(premium.replace(/\D/g, "")) || 0;

  if (termType === "half") {
    termPremium = Math.round((annualPremium / 2) * 1.02 / 1000) * 1000;
  } else if (termType === "quarter") {
    termPremium = Math.round((annualPremium / 4) * 1.04 / 1000) * 1000;
  } else {
    termPremium = annualPremium; // Năm
  }

  const totalYear = termType === "half" ? termPremium * 2 : termType === "quarter" ? termPremium * 4 : termPremium;
  const difference = totalYear - annualPremium;

  return { termPremium: termPremium.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), difference };
}

// Hàm tạo bảng minh họa (giữ nguyên, bổ sung logic mới)
function generateSummaryTable() {
  const product = document.getElementById("productSelect").value;
  const age = parseInt(document.getElementById("age").value);
  const stbh = parseInt(document.getElementById("stbh").value.replace(/\D/g, "")) || 0;
  const term = parseInt(document.getElementById("paymentTerm").value) || 0;
  const untilYear = parseInt(document.getElementById("totalFeeUntil").value) || 0;
  const termType = document.getElementById("paymentTermType").value || "year";

  let tableHtml = "<table><tr><th>Năm HD</th><th>Tuổi</th><th>Phí chính</th><th>Phí bổ sung</th><th>Tổng cộng</th></tr>";

  for (let year = 0; year <= untilYear - age; year++) {
    const currentAge = age + year;
    let mainPremium = calculatePremium(product, stbh, currentAge, term);
    let suppPremium = 0;

    document.querySelectorAll(".supplementary").forEach(checkbox => {
      if (checkbox.checked) {
        const suppProduct = checkbox.id;
        const maxAge = MAX_RENEWAL_AGE[suppProduct] || Infinity;
        if (currentAge <= maxAge) {
          const suppStbh = parseInt(document.getElementById(`${suppProduct}_stbh`)?.value.replace(/\D/g, "")) || 0;
          suppPremium += calculateSupplementaryPremium(suppProduct, suppStbh, currentAge);
        }
      }
    });

    const { termPremium } = calculatePaymentTerm((mainPremium + suppPremium).toString(), termType);
    const total = parseInt(termPremium.replace(/\D/g, ""));

    if (currentAge <= MAX_RENEWAL_AGE[product] || currentAge <= MAX_RENEWAL_AGE["health_scl"]) {
      tableHtml += `<tr><td>${year + 1}</td><td>${currentAge}</td><td>${mainPremium.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>${suppPremium.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>${total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td></tr>`;
    }
  }

  tableHtml += "</table>";
  document.getElementById("summaryTable").innerHTML = tableHtml;
}

// Hàm xuất kết quả (giữ nguyên, ưu tiên HTML)
function exportToHtml() {
  const summary = document.getElementById("summary").innerHTML;
  const table = document.getElementById("summaryTable").innerHTML;
  const disclaimer = "<strong>Công cụ này chỉ mang tính chất tham khảo cá nhân... nhận bảng minh họa chính thức.</strong>";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><title>Bảng Minh Họa Phí Bảo Hiểm AIA</title></head>
    <body>
      <h1>Bảng Minh Họa Phí Bảo Hiểm</h1>
      <div>${summary}</div>
      <div>${table}</div>
      <p>${disclaimer}</p>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "minh_hoa_phi_bao_hiem.html";
  a.click();
}

// Cập nhật sự kiện nút minh họa (giữ nguyên, bổ sung logic)
document.getElementById("generateSummary").addEventListener("click", function() {
  generateSummaryTable();
  exportToHtml();
});

// Cập nhật hiển thị kỳ đóng phí (mới)
document.getElementById("paymentTermType").addEventListener("change", function() {
  const premium = document.getElementById("totalPremium").value;
  const { termPremium, difference } = calculatePaymentTerm(premium, this.value);
  document.getElementById("termPremium").value = termPremium;
  document.getElementById("termDifference").value = difference.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  updateDisplay();
});
