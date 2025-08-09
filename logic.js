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
