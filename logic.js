import { product_data, MAX_ENTRY_AGE, MAX_RENEWAL_AGE, MAX_STBH } from './data.js';

let supplementaryInsuredCount = 0;
let currentMainProductState = { product: null, age: null };

document.addEventListener('DOMContentLoaded', () => {
    initPerson(document.getElementById('main-person-container'), 'main');
    initMainProductLogic();
    initSupplementaryButton();
    initSummaryModal();
    attachGlobalListeners();
    calculateAll();
});

function attachGlobalListeners() {
    const allInputs = 'input, select';
    document.body.addEventListener('change', (e) => {
        const checkboxSelectors = [
            '.health-scl-checkbox',
            '.bhn-checkbox',
            '.accident-checkbox',
            '.hospital-support-checkbox',
            '.waiver-premium-checkbox'
        ];
        if (checkboxSelectors.some(selector => e.target.matches(selector))) {
            const section = e.target.closest('.product-section');
            const options = section.querySelector('.product-options');
            if (e.target.checked && !e.target.disabled) {
                options.classList.remove('hidden');
            } else {
                options.classList.add('hidden');
            }
            calculateAll();
        } else if (e.target.matches(allInputs)) {
            validateInput(e.target);
            restrictMainProductOptions();
            calculateAll();
        }
    });
    document.body.addEventListener('input', (e) => {
        if (e.target.matches('input[type="text"]') && !e.target.classList.contains('dob-input') && !e.target.classList.contains('occupation-input') && !e.target.classList.contains('name-input')) {
            formatNumberInput(e.target);
            calculateAll();
        } else if (e.target.matches('input[type="number"]')) {
            calculateAll();
        }
    });
}

function validateInput(input) {
    const errorElement = input.parentElement.querySelector('.error-message');
    if (input.classList.contains('name-input') && !input.value.trim()) {
        showFieldError(errorElement, 'Vui lòng nhập họ và tên');
    } else if (input.classList.contains('dob-input')) {
        const date = chrono.parseDate(input.value);
        if (!date) {
            showFieldError(errorElement, 'Ngày sinh không hợp lệ, nhập DD/MM/YYYY');
        } else {
            clearFieldError(errorElement);
        }
    } else if (input.classList.contains('occupation-input')) {
        const occupation = product_data.occupations.find(o => o.name === input.value);
        if (!occupation || occupation.group === 0) {
            showFieldError(errorElement, 'Chọn nghề nghiệp từ danh sách');
        } else {
            clearFieldError(errorElement);
        }
    } else if (input.id === 'payment-term') {
        const mainPersonInfo = getCustomerInfo(document.getElementById('main-person-container'), true);
        const minTerm = 4;
        const maxTerm = 100 - mainPersonInfo.age - 1;
        const value = parseInt(input.value, 10);
        if (isNaN(value) || value < minTerm || value > maxTerm) {
            showFieldError(errorElement, `Thời hạn không hợp lệ, từ ${minTerm} đến ${maxTerm}`);
        } else {
            clearFieldError(errorElement);
        }
        input.parentElement.querySelector('.input-hint').textContent = `Nhập từ ${minTerm} đến ${maxTerm}`;
    } else {
        clearFieldError(errorElement);
    }
}

function showFieldError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

function clearFieldError(element) {
    if (element) {
        element.textContent = '';
        element.classList.add('hidden');
    }
}

function restrictMainProductOptions() {
    const mainPersonInfo = getCustomerInfo(document.getElementById('main-person-container'), true);
    const mainProductSelect = document.getElementById('main-product');
    const options = mainProductSelect.querySelectorAll('option');
    const paymentTermContainer = document.getElementById('payment-term-container');
    const abuvTermContainer = document.getElementById('abuv-term-container');

    options.forEach(option => {
        if (option.value === '') return;
        const product = option.value;
        let isEligible = true;

        if (product === 'TRON_TAM_AN') {
            if (mainPersonInfo.riskGroup === 4 || 
                (mainPersonInfo.gender === 'Nam' && mainPersonInfo.age < 12) || 
                (mainPersonInfo.gender === 'Nữ' && mainPersonInfo.age < 28) ||
                mainPersonInfo.age > 60) {
                isEligible = false;
            }
        } else if (product === 'AN_BINH_UU_VIET') {
            const term = parseInt(document.getElementById('abuv-term')?.value || '15', 10);
            if ((mainPersonInfo.gender === 'Nam' && mainPersonInfo.age < 12) || 
                (mainPersonInfo.gender === 'Nữ' && mainPersonInfo.age < 28) ||
                (term === 5 && mainPersonInfo.age > 65) ||
                (term === 10 && mainPersonInfo.age > 60) ||
                (term === 15 && mainPersonInfo.age > 55)) {
                isEligible = false;
            }
        } else if (mainPersonInfo.age > MAX_ENTRY_AGE[product]) {
            isEligible = false;
        }

        option.disabled = !isEligible;
        option.classList.toggle('hidden', !isEligible);
    });

    if (mainProductSelect.value === 'AN_BINH_UU_VIET') {
        paymentTermContainer.classList.add('hidden');
        abuvTermContainer.classList.remove('hidden');
    } else {
        paymentTermContainer.classList.remove('hidden');
        abuvTermContainer.classList.add('hidden');
    }
}

function initPerson(container, personId, isSupp = false) {
    if (!container) return;
    container.dataset.personId = personId;

    initDateFormatter(container.querySelector('.dob-input'));
    initOccupationAutocomplete(container.querySelector('.occupation-input'), container);
    
    const suppProductsContainer = isSupp ? container.querySelector('.supplementary-products-container') : document.querySelector('#main-supp-container .supplementary-products-container');
    suppProductsContainer.innerHTML = generateSupplementaryProductsHtml(personId);
    
    const sclSection = suppProductsContainer.querySelector('.health-scl-section');
    if (sclSection) {
        const mainCheckbox = sclSection.querySelector('.health-scl-checkbox');
        const programSelect = sclSection.querySelector('.health-scl-program');
        const scopeSelect = sclSection.querySelector('.health-scl-scope');
        const outpatientCheckbox = sclSection.querySelector('.health-scl-outpatient');
        const dentalCheckbox = sclSection.querySelector('.health-scl-dental');

        const handleProgramChange = () => {
            const programChosen = programSelect.value !== '';
            outpatientCheckbox.disabled = !programChosen;
            dentalCheckbox.disabled = !programChosen;
            if (!programChosen) {
                outpatientCheckbox.checked = false;
                dentalCheckbox.checked = false;
            }
            calculateAll();
        };

        const handleMainCheckboxChange = () => {
            const isChecked = mainCheckbox.checked && !mainCheckbox.disabled;
            programSelect.disabled = !isChecked;
            scopeSelect.disabled = !isChecked;
            const options = sclSection.querySelector('.product-options');
            options.classList.toggle('hidden', !isChecked);
            if (!isChecked) {
                programSelect.value = '';
                outpatientCheckbox.checked = false;
                dentalCheckbox.checked = false;
            }
            handleProgramChange();
            calculateAll();
        };

        programSelect.addEventListener('change', handleProgramChange);
        mainCheckbox.addEventListener('change', handleMainCheckboxChange);
    }

    ['bhn', 'accident', 'hospital-support', 'waiver-premium'].forEach(product => {
        const section = suppProductsContainer.querySelector(`.${product}-section`);
        if (section) {
            const checkbox = section.querySelector(`.${product}-checkbox`);
            const handleCheckboxChange = () => {
                const isChecked = checkbox.checked && !checkbox.disabled;
                const options = section.querySelector('.product-options');
                options.classList.toggle('hidden', !isChecked);
                calculateAll();
            };
            checkbox.addEventListener('change', handleCheckboxChange);
        }
    });
}

function initMainProductLogic() {
    document.getElementById('main-product').addEventListener('change', () => {
        restrictMainProductOptions();
        calculateAll();
    });
}

function initSupplementaryButton() {
    document.getElementById('add-supp-insured-btn').addEventListener('click', () => {
        supplementaryInsuredCount++;
        const personId = `supp${supplementaryInsuredCount}`;
        const container = document.getElementById('supplementary-insured-container');
        const newPersonDiv = document.createElement('div');
        newPersonDiv.className = 'person-container space-y-6 bg-gray-100 p-4 rounded-lg mt-4';
        newPersonDiv.id = `person-container-${personId}`;
        newPersonDiv.innerHTML = generateSupplementaryPersonHtml(personId, supplementaryInsuredCount);
        container.appendChild(newPersonDiv);
        initPerson(newPersonDiv, personId, true);
        calculateAll();
    });
}

function initSummaryModal() {
    const modal = document.getElementById('summary-modal');
    document.getElementById('view-summary-btn').addEventListener('click', generateSummaryTable);
    document.getElementById('close-summary-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    updateTargetAge();
}

function updateTargetAge() {
    const mainPersonContainer = document.getElementById('main-person-container');
    const mainPersonInfo = getCustomerInfo(mainPersonContainer, true);
    const mainProduct = mainPersonInfo.mainProduct;
    const targetAgeInput = document.getElementById('target-age-input');

    if (mainProduct === 'TRON_TAM_AN') {
        targetAgeInput.value = mainPersonInfo.age + 10 - 1;
        targetAgeInput.disabled = true;
    } else if (mainProduct === 'AN_BINH_UU_VIET') {
        const termSelect = document.getElementById('abuv-term');
        const term = termSelect ? parseInt(termSelect.value || '15', 10) : 15;
        targetAgeInput.value = mainPersonInfo.age + term - 1;
        targetAgeInput.disabled = true;
    } else {
        const paymentTermInput = document.getElementById('payment-term');
        const paymentTerm = paymentTermInput ? parseInt(paymentTermInput.value, 10) || 0 : 0;
        targetAgeInput.disabled = false;
        targetAgeInput.min = mainPersonInfo.age + paymentTerm - 1;
        if (!targetAgeInput.value || parseInt(targetAgeInput.value, 10) < mainPersonInfo.age + paymentTerm - 1) {
            targetAgeInput.value = mainPersonInfo.age + paymentTerm - 1;
        }
    }
}

function calculateAll() {
    const mainPersonContainer = document.getElementById('main-person-container');
    const mainPersonInfo = getCustomerInfo(mainPersonContainer, true);
    let totalMainFee = 0;
    let totalFee = 0;

    if (mainPersonInfo.mainProduct) {
        totalMainFee = calculateMainProductFee(mainPersonInfo);
        totalFee += totalMainFee;
        document.getElementById('main-fee').textContent = formatCurrency(totalMainFee);
    }

    const suppFees = Array.from(document.querySelectorAll('.person-container')).reduce((sum, container) => {
        const personInfo = getCustomerInfo(container, container.dataset.personId === 'main');
        const suppFee = calculateSupplementaryFee(personInfo);
        totalFee += suppFee;
        return sum + suppFee;
    }, 0);

    document.getElementById('total-fee').textContent = formatCurrency(totalFee);
}

function calculateMainProductFee(personInfo) {
    if (!personInfo.mainProduct) return 0;
    const rates = product_data.pul_rates[personInfo.mainProduct];
    const rate = rates.find(r => r.age === personInfo.age)?.[personInfo.gender.toLowerCase()];
    if (!rate) return 0;

    const paymentFrequency = document.getElementById('payment-frequency').value;
    const frequencyFactor = { yearly: 1, quarterly: 0.265, 'semi-annually': 0.52 };
    let fee = (personInfo.mainProduct === 'AN_BINH_UU_VIET' ? parseInt(document.getElementById('abuv-term')?.value || '15', 10) : parseInt(document.getElementById('payment-term')?.value || '0', 10)) * rate * 1000;
    fee = Math.round(fee * frequencyFactor[paymentFrequency] / 1000) * 1000;
    return fee;
}

function calculateSupplementaryFee(personInfo) {
    let totalFee = 0;
    const container = document.querySelector(`[data-person-id="${personInfo.personId}"]`);
    
    if (container.querySelector('.health-scl-checkbox')?.checked) {
        const program = container.querySelector('.health-scl-program')?.value;
        const scope = container.querySelector('.health-scl-scope')?.value;
        const outpatient = container.querySelector('.health-scl-outpatient')?.checked;
        const dental = container.querySelector('.health-scl-dental')?.checked;
        
        if (program && scope) {
            const rate = product_data.health_scl_rates[scope].find(r => personInfo.age >= r.ageMin && personInfo.age <= r.ageMax)?.[program] || 0;
            totalFee += rate;
            if (outpatient) {
                totalFee += product_data.health_scl_rates.outpatient.find(r => personInfo.age >= r.ageMin && personInfo.age <= r.ageMax)?.[program] || 0;
            }
            if (dental) {
                totalFee += product_data.health_scl_rates.dental.find(r => personInfo.age >= r.ageMin && personInfo.age <= r.ageMax)?.[program] || 0;
            }
        }
    }

    if (container.querySelector('.bhn-checkbox')?.checked) {
        const stbh = parseFormattedNumber(container.querySelector('.bhn-stbh')?.value);
        const rate = product_data.bhn_rates.find(r => r.age === personInfo.age)?.[personInfo.gender.toLowerCase()] || 0;
        totalFee += (stbh / 1000) * rate;
    }

    if (container.querySelector('.accident-checkbox')?.checked) {
        const stbh = parseFormattedNumber(container.querySelector('.accident-stbh')?.value);
        const rate = product_data.accident_rates[personInfo.riskGroup] || 0;
        totalFee += (stbh / 1000) * rate;
    }

    if (container.querySelector('.hospital-support-checkbox')?.checked) {
        const stbh = parseFormattedNumber(container.querySelector('.hospital-support-stbh')?.value);
        const rate = product_data.hospital_fee_support_rates.find(r => personInfo.age >= r.ageMin && personInfo.age <= r.ageMax)?.rate || 0;
        totalFee += (stbh / 100) * rate;
    }

    if (container.querySelector('.waiver-premium-checkbox')?.checked) {
        const stbh = parseFormattedNumber(container.querySelector('.waiver-premium-stbh')?.value);
        const rate = product_data.waiver_premium_rates.find(r => r.age === personInfo.age)?.[personInfo.gender.toLowerCase()] || 0;
        totalFee += (stbh / 1000) * rate;
    }

    const paymentFrequency = document.getElementById('payment-frequency').value;
    const frequencyFactor = { yearly: 1, quarterly: 0.265, 'semi-annually': 0.52 };
    return Math.round(totalFee * frequencyFactor[paymentFrequency] / 1000) * 1000;
}

function getCustomerInfo(container, isMain = false) {
    const dobInput = container.querySelector('.dob-input');
    const date = chrono.parseDate(dobInput?.value);
    const age = date ? Math.floor((new Date(2025, 7, 9) - date) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const occupation = product_data.occupations.find(o => o.name === container.querySelector('.occupation-input')?.value);
    
    return {
        personId: container.dataset.personId,
        name: container.querySelector('.name-input')?.value || '',
        age,
        gender: container.querySelector('.gender-select')?.value || 'Nam',
        occupation: occupation?.name || '',
        riskGroup: occupation?.group || 0,
        mainProduct: isMain ? document.getElementById('main-product')?.value : null
    };
}

function generateSummaryTable() {
    const mainPersonInfo = getCustomerInfo(document.getElementById('main-person-container'), true);
    const targetAge = parseInt(document.getElementById('target-age-input')?.value, 10) || mainPersonInfo.age;
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Người Được BH</th>
                    <th>Sản Phẩm</th>
                    <th>Phí Bảo Hiểm</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (mainPersonInfo.mainProduct) {
        const mainFee = calculateMainProductFee(mainPersonInfo);
        tableHtml += `
            <tr>
                <td>${mainPersonInfo.name}</td>
                <td>${mainPersonInfo.mainProduct}</td>
                <td class="text-right">${formatCurrency(mainFee)}</td>
            </tr>
        `;
    }

    document.querySelectorAll('.person-container').forEach(container => {
        const personInfo = getCustomerInfo(container, container.dataset.personId === 'main');
        const suppFee = calculateSupplementaryFee(personInfo);
        if (suppFee > 0) {
            tableHtml += `
                <tr>
                    <td>${personInfo.name}</td>
                    <td>Sản phẩm bổ sung</td>
                    <td class="text-right">${formatCurrency(suppFee)}</td>
                </tr>
            `;
        }
    });

    tableHtml += `
        </tbody>
        </table>
        <p class="font-bold mt-4">Lưu ý: Bảng minh họa này chỉ mang tính chất tham khảo và không thay thế hợp đồng bảo hiểm chính thức.</p>
    `;

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng Minh Họa Phí Bảo Hiểm</title>
    <style>
        body { font-family: 'Noto Sans', sans-serif; margin: 40px; }
        h1 { text-align: center; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px; border: 1px solid #d1d5db; }
        th { background-color: #f3f4f6; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <img src="/assets/aia-logo.png" alt="AIA Logo" style="height: 50px; display: block; margin: 0 auto 20px;">
    <h1>Bảng Minh Họa Phí Bảo Hiểm</h1>
    ${tableHtml}
    <div style="margin-top: 20px; text-align: center;" class="no-print">
        <button onclick="window.print()" style="background-color: #D9232D; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer;">In thành PDF</button>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bang_minh_hoa_phi_bao_hiem.html';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function formatCurrency(value) {
    if (isNaN(value)) return '0';
    return Math.round(value).toLocaleString('vi-VN');
}

function formatNumberInput(input) {
    if (!input || !input.value) return;
    let value = input.value.replace(/[.,]/g, '');
    if (!isNaN(value) && value.length > 0) {
        input.value = parseInt(value, 10).toLocaleString('vi-VN');
    } else if (input.value !== '') {
        input.value = '';
    }
}

function parseFormattedNumber(formattedString) {
    return parseInt(String(formattedString).replace(/[.,]/g, ''), 10) || 0;
}

function initDateFormatter(input) {
    if (!input) return;
    input.addEventListener('input', () => {
        const date = chrono.parseDate(input.value);
        const ageSpan = input.closest('.person-container').querySelector('.age-span');
        if (date) {
            const age = Math.floor((new Date(2025, 7, 9) - date) / (365.25 * 24 * 60 * 60 * 1000));
            ageSpan.textContent = age;
        } else {
            ageSpan.textContent = '0';
        }
        restrictMainProductOptions();
        calculateAll();
    });
}

function initOccupationAutocomplete(input, container) {
    if (!input) return;
    const autocomplete = container.querySelector('.occupation-autocomplete');
    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        const matches = product_data.occupations.filter(o => o.name.toLowerCase().includes(query));
        autocomplete.innerHTML = matches.map(o => `<div class="autocomplete-item">${o.name}</div>`).join('');
        autocomplete.classList.toggle('hidden', matches.length === 0);
        autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.textContent;
                const occupation = product_data.occupations.find(o => o.name === item.textContent);
                container.querySelector('.risk-group-span').textContent = occupation.group;
                autocomplete.classList.add('hidden');
                restrictMainProductOptions();
                calculateAll();
            });
        });
    });
}

function generateSupplementaryPersonHtml(personId, count) {
    return `
        <button class="w-full text-right text-sm text-red-600 font-semibold" onclick="this.closest('.person-container').remove(); calculateAll();">Xóa NĐBH này</button>
        <h3 class="text-lg font-bold text-gray-700 mb-2 border-t pt-4">NĐBH Bổ Sung ${count}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label for="name-${personId}" class="font-medium text-gray-700 block mb-1">Họ và Tên</label>
                <input type="text" id="name-${personId}" class="form-input name-input" placeholder="Trần Thị B">
                <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                <p class="input-hint text-gray-500 text-sm mt-1">Nhập họ và tên đầy đủ</p>
            </div>
            <div>
                <label for="dob-${personId}" class="font-medium text-gray-700 block mb-1">Ngày sinh</label>
                <input type="text" id="dob-${personId}" class="form-input dob-input" placeholder="DD/MM/YYYY">
                <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                <p class="input-hint text-gray-500 text-sm mt-1">Nhập theo DD/MM/YYYY</p>
            </div>
            <div>
                <label for="gender-${personId}" class="font-medium text-gray-700 block mb-1">Giới tính</label>
                <select id="gender-${personId}" class="form-select gender-select">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                </select>
            </div>
            <div class="flex items-end space-x-4">
                <p class="text-lg">Tuổi: <span id="age-${personId}" class="font-bold text-aia-red age-span">0</span></p>
            </div>
            <div class="relative">
                <label for="occupation-input-${personId}" class="font-medium text-gray-700 block mb-1">Nghề nghiệp</label>
                <input type="text" id="occupation-input-${personId}" class="form-input occupation-input" placeholder="Gõ để tìm nghề nghiệp...">
                <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                <p class="input-hint text-gray-500 text-sm mt-1">Chọn nghề nghiệp từ danh sách</p>
                <div class="occupation-autocomplete absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 hidden max-h-60 overflow-y-auto"></div>
            </div>
            <div class="flex items-end space-x-4">
                <p class="text-lg">Nhóm nghề: <span id="risk-group-${personId}" class="font-bold text-aia-red risk-group-span">...</span></p>
            </div>
        </div>
        <div class="mt-4">
            <h4 class="text-md font-semibold text-gray-800 mb-2">Sản phẩm bổ sung cho người này</h4>
            <div class="supplementary-products-container space-y-6"></div>
        </div>
    `;
}

function generateSupplementaryProductsHtml(personId) {
    return `
        <div class="product-section health-scl-section">
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" class="form-checkbox health-scl-checkbox">
                <span class="text-lg font-medium text-gray-800">Sức khỏe Bùng Gia Lực</span>
            </label>
            <div class="product-options hidden mt-3 pl-8 space-y-4 border-l-2 border-gray-200">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="font-medium text-gray-700 block mb-1">Quyền lợi chính (Bắt buộc)</label>
                        <select class="form-select health-scl-program" disabled>
                            <option value="">-- Chọn chương trình --</option>
                            <option value="co_ban">Cơ bản</option>
                            <option value="nang_cao">Nâng cao</option>
                            <option value="toan_dien">Toàn diện</option>
                            <option value="hoan_hao">Hoàn hảo</option>
                        </select>
                    </div>
                    <div>
                        <label class="font-medium text-gray-700 block mb-1">Phạm vi địa lý</label>
                        <select class="form-select health-scl-scope" disabled>
                            <option value="main_vn">Việt Nam</option>
                            <option value="main_global">Toàn cầu (trừ Hoa Kỳ)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <span class="font-medium text-gray-700 block mb-2">Quyền lợi tùy chọn:</span>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" class="form-checkbox health-scl-outpatient" disabled>
                            <span>Điều trị ngoại trú</span>
                        </label>
                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" class="form-checkbox health-scl-dental" disabled>
                            <span>Chăm sóc nha khoa</span>
                        </label>
                    </div>
                </div>
                <div class="text-right font-semibold text-aia-red fee-display min-h-[1.5rem]"></div>
            </div>
        </div>
        <div class="product-section bhn-section">
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" class="form-checkbox bhn-checkbox">
                <span class="text-lg font-medium text-gray-800">Bệnh Hiểm Nghèo 2.0</span>
            </label>
            <div class="product-options hidden mt-3 pl-8 space-y-3 border-l-2 border-gray-200">
                <div>
                    <label class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label>
                    <input type="text" class="form-input bhn-stbh" placeholder="VD: 500.000.000">
                    <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                </div>
                <div class="text-right font-semibold text-aia-red fee-display min-h-[1.5rem]"></div>
            </div>
        </div>
        <div class="product-section accident-section">
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" class="form-checkbox accident-checkbox">
                <span class="text-lg font-medium text-gray-800">Bảo hiểm Tai nạn</span>
            </label>
            <div class="product-options hidden mt-3 pl-8 space-y-3 border-l-2 border-gray-200">
                <div>
                    <label class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label>
                    <input type="text" class="form-input accident-stbh" placeholder="VD: 200.000.000">
                    <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                </div>
                <div class="text-right font-semibold text-aia-red fee-display min-h-[1.5rem]"></div>
            </div>
        </div>
        <div class="product-section hospital-support-section">
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" class="form-checkbox hospital-support-checkbox">
                <span class="text-lg font-medium text-gray-800">Hỗ trợ chi phí nằm viện</span>
            </label>
            <div class="product-options hidden mt-3 pl-8 space-y-3 border-l-2 border-gray-200">
                <div>
                    <label class="font-medium text-gray-700 block mb-1">Số tiền hỗ trợ/ngày</label>
                    <input type="text" class="form-input hospital-support-stbh" placeholder="VD: 300.000">
                    <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                    <p class="hospital-support-validation text-sm text-gray-500 mt-1"></p>
                </div>
                <div class="text-right font-semibold text-aia-red fee-display min-h-[1.5rem]"></div>
            </div>
        </div>
        <div class="product-section waiver-premium-section">
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" class="form-checkbox waiver-premium-checkbox">
                <span class="text-lg font-medium text-gray-800">Miễn đóng phí 3.0</span>
            </label>
            <div class="product-options hidden mt-3 pl-8 space-y-3 border-l-2 border-gray-200">
                <div>
                    <label class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label>
                    <input type="text" class="form-input waiver-premium-stbh" placeholder="VD: 500.000.000">
                    <p class="error-message text-red-600 text-sm mt-1 hidden"></p>
                </div>
                <div class="text-right font-semibold text-aia-red fee-display min-h-[1.5rem]"></div>
            </div>
        </div>
    `;
}
