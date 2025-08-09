import { product_data } from './data.js';

// --- BỔ SUNG CHỌN KỲ ĐÓNG PHÍ ---
const PAYMENT_PERIODS = [
    { key: 'year', label: 'Năm', factor: 1 },
    { key: 'half', label: 'Nửa năm', factor: 2 },
    { key: 'quarter', label: 'Quý', factor: 4 }
];

let supplementaryInsuredCount = 0;
let currentMainProductState = { product: null, age: null };

const MAX_ENTRY_AGE = {
    PUL_TRON_DOI: 70, PUL_15_NAM: 70, PUL_5_NAM: 70, KHOE_BINH_AN: 70, VUNG_TUONG_LAI: 70,
    TRON_TAM_AN: 60, AN_BINH_UU_VIET: 65,
    health_scl: 65, bhn: 70, accident: 64, hospital_support: 55
};

const MAX_RENEWAL_AGE = {
    health_scl: 74, bhn: 85, accident: 65, hospital_support: 59
};

const MAX_STBH = {
    bhn: 5_000_000_000,
    accident: 8_000_000_000
};

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
            '.hospital-support-checkbox'
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

    ['bhn', 'accident', 'hospital-support'].forEach(product => {
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
    document.getElementById('main-product').addEventListener('change', calculateAll);
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

    const targetAgeInput = document.getElementById('target-age-input');
    const mainPersonContainer = document.getElementById('main-person-container');
    const mainPersonInfo = getCustomerInfo(mainPersonContainer, true);
    const mainProduct = mainPersonInfo.mainProduct;

    if (mainProduct === 'TRON_TAM_AN') {
        targetAgeInput.value = mainPersonInfo.age + 10 - 1;
        targetAgeInput.disabled = true;
    } else if (mainProduct === 'AN_BINH_UU_VIET') {
        const termSelect = document.getElementById('abuv-term');
        const term = parseInt(termSelect?.value || '15', 10);
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
    const abuvTermSelect = document.getElementById('abuv-term');
    document.getElementById('main-product').addEventListener('change', () => {
        updateTargetAge();
        if (document.getElementById('summary-modal').classList.contains('hidden')) {
            calculateAll();
        } else {
            generateSummaryTable();
        }
    });
    document.getElementById('dob-main').addEventListener('input', () => {
        updateTargetAge();
        if (document.getElementById('summary-modal').classList.contains('hidden')) {
            calculateAll();
        } else {
            generateSummaryTable();
        }
    });
    if (abuvTermSelect) {
        abuvTermSelect.addEventListener('change', () => {
            updateTargetAge();
            if (document.getElementById('summary-modal').classList.contains('hidden')) {
                calculateAll();
            } else {
                generateSummaryTable();
            }
        });
    }
    document.getElementById('payment-term')?.addEventListener('change', () => {
        updateTargetAge();
        if (document.getElementById('summary-modal').classList.contains('hidden')) {
            calculateAll();
        } else {
            generateSummaryTable();
        }
    });
    document.getElementById('payment-period')?.addEventListener('change', () => {
        calculateAll();
    });
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

function initDateFormatter(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
        if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
        e.target.value = value.slice(0, 10);
    });
}

function initOccupationAutocomplete(input, container) {
    if (!input) return;
    const autocompleteContainer = container.querySelector('.occupation-autocomplete');
    const riskGroupSpan = container.querySelector('.risk-group-span');

    input.addEventListener('input', () => {
        const value = input.value.toLowerCase();
        autocompleteContainer.innerHTML = '';
        if (value.length < 2) {
            autocompleteContainer.classList.add('hidden');
            return;
        }

        const filtered = product_data.occupations
            .filter(o => o.group > 0 && o.name.toLowerCase().includes(value));

        if (filtered.length > 0) {
            filtered.forEach(occ => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = occ.name;
                item.addEventListener('click', () => {
                    input.value = occ.name;
                    input.dataset.group = occ.group;
                    riskGroupSpan.textContent = occ.group;
                    autocompleteContainer.classList.add('hidden');
                    calculateAll();
                });
                autocompleteContainer.appendChild(item);
            });
            autocompleteContainer.classList.remove('hidden');
        } else {
            autocompleteContainer.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            autocompleteContainer.classList.add('hidden');
        }
    });
}

function getCustomerInfo(container, isMain = false) {
    const dobInput = container.querySelector('.dob-input');
    const genderSelect = container.querySelector('.gender-select');
    const occupationInput = container.querySelector('.occupation-input');
    const ageSpan = container.querySelector('.age-span');
    const riskGroupSpan = container.querySelector('.risk-group-span');
    const nameInput = container.querySelector('.name-input');
    
    let age = 0;
    const dobStr = dobInput ? dobInput.value : '';
    if (dobStr && new RegExp('^\\d{2}/\\d{2}/\\d{4}$').test(dobStr)) {
        const parts = dobStr.split('/');
        const birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(birthDate)) {
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }
    }

    if (ageSpan) ageSpan.textContent = age;
    const riskGroup = occupationInput ? parseInt(occupationInput.dataset.group, 10) || 0 : 0;
    if (riskGroupSpan) riskGroupSpan.textContent = riskGroup > 0 ? riskGroup : '...';

    const info = {
        age,
        gender: genderSelect ? genderSelect.value : 'Nam',
        riskGroup,
        container,
        name: nameInput ? nameInput.value : 'NĐBH Chính'
    };

    if (isMain) {
        info.mainProduct = document.getElementById('main-product').value;
    }

    return info;
}

// --- LOGIC TÍNH PHÍ KỲ ĐÓNG PHÍ, LÀM TRÒN, FORMAT SỐ ---
function calculateAll() {
    try {
        clearError();
        const mainPersonContainer = document.getElementById('main-person-container');
        const mainPersonInfo = getCustomerInfo(mainPersonContainer, true);

        updateMainProductVisibility(mainPersonInfo);
        const mainPremium = calculateMainPremium(mainPersonInfo);

        const paymentPeriod = getPaymentPeriod();

        updateSupplementaryProductVisibility(mainPersonInfo, mainPremium, document.querySelector('#main-supp-container .supplementary-products-container'));

        let totalSupplementaryPremium = 0;
        let totalHospitalSupportStbh = 0;

        document.querySelectorAll('.person-container').forEach(container => {
            const isMain = container.id === 'main-person-container';
            const personInfo = getCustomerInfo(container, isMain);
            const suppProductsContainer = isMain ? document.querySelector('#main-supp-container .supplementary-products-container') : container.querySelector('.supplementary-products-container');
            if (!suppProductsContainer) return;

            updateSupplementaryProductVisibility(personInfo, mainPremium, suppProductsContainer);

            let suppPremium = 0;
            suppPremium += calculateHealthSclPremium(personInfo, suppProductsContainer);
            suppPremium += calculateBhnPremium(personInfo, suppProductsContainer);
            suppPremium += calculateAccidentPremium(personInfo, suppProductsContainer);
            suppPremium += calculateHospitalSupportPremium(personInfo, mainPremium, suppProductsContainer, totalHospitalSupportStbh);

            const hospitalSupportStbh = parseFormattedNumber(suppProductsContainer.querySelector('.hospital-support-stbh')?.value || '0');
            if (suppProductsContainer.querySelector('.hospital-support-checkbox')?.checked && hospitalSupportStbh > 0) {
                totalHospitalSupportStbh += hospitalSupportStbh;
            }

            suppPremium = applyPaymentPeriodFactor(suppPremium, paymentPeriod);
            totalSupplementaryPremium += suppPremium;
        });

        const mainPremiumWithPeriod = applyPaymentPeriodFactor(mainPremium, paymentPeriod);
        const mainPremiumRounded = roundToThousand(mainPremiumWithPeriod);
        const totalSupplementaryPremiumRounded = roundToThousand(totalSupplementaryPremium);

        const totalPremium = mainPremiumRounded + totalSupplementaryPremiumRounded;
        updateSummaryUI({ mainPremium: mainPremiumRounded, totalSupplementaryPremium: totalSupplementaryPremiumRounded, totalPremium });

    } catch (error) {
        showError(error.message);
        updateSummaryUI({ mainPremium: 0, totalSupplementaryPremium: 0, totalPremium: 0 });
    }
}

function getPaymentPeriod() {
    const select = document.getElementById('payment-period');
    if (select && select.value) {
        return PAYMENT_PERIODS.find(p => p.key === select.value) || PAYMENT_PERIODS[0];
    }
    return PAYMENT_PERIODS[0];
}

function applyPaymentPeriodFactor(value, paymentPeriod) {
    if (!paymentPeriod) return value;
    let result = value * paymentPeriod.factor;
    return result;
}

function roundToThousand(num) {
    return Math.round(num / 1000) * 1000;
}

function updateMainProductVisibility(customer) {
    const { age, gender, riskGroup } = customer;
    const mainProductSelect = document.getElementById('main-product');
    document.querySelectorAll('#main-product option').forEach(option => {
        let isEligible = true;
        const productKey = option.value;
        if (!productKey) return;
        const maxEntryAge = MAX_ENTRY_AGE[productKey];
        isEligible = age >= 0 && age <= maxEntryAge;
        if (productKey === "TRON_TAM_AN" || productKey === "AN_BINH_UU_VIET") {
            isEligible = isEligible && ((gender === 'Nam' && age >= 12) || (gender === 'Nữ' && age >= 28));
        }
        if (productKey === "TRON_TAM_AN" && riskGroup === 4) {
            isEligible = false;
        }
        option.disabled = !isEligible;
        option.classList.toggle('hidden', !isEligible);
    });

    if (mainProductSelect.options[mainProductSelect.selectedIndex]?.disabled) {
        mainProductSelect.value = "";
    }
    const newProduct = mainProductSelect.value;
    if (newProduct === 'TRON_TAM_AN') {
        document.getElementById('supplementary-insured-container').classList.add('hidden');
        document.getElementById('add-supp-insured-btn').classList.add('hidden');
        supplementaryInsuredCount = 0;
        document.getElementById('supplementary-insured-container').innerHTML = '';
    } else {
        document.getElementById('supplementary-insured-container').classList.remove('hidden');
        document.getElementById('add-supp-insured-btn').classList.remove('hidden');
    }
    if (currentMainProductState.product !== newProduct || currentMainProductState.age !== age) {
        renderMainProductOptions(customer);
        currentMainProductState.product = newProduct;
        currentMainProductState.age = age;
    }
}

function updateSupplementaryProductVisibility(customer, mainPremium, container) {
    const { age, riskGroup } = customer;
    const mainProduct = document.getElementById('main-product').value;

    const showOrHide = (sectionId, productKey, condition) => {
        const section = container.querySelector(`.${sectionId}-section`);
        if (!section) {
            return;
        }
        const checkbox = section.querySelector('input[type="checkbox"]');
        const options = section.querySelector('.product-options');
        const finalCondition = condition && age >= 0 && age <= MAX_ENTRY_AGE[productKey] && (sectionId !== 'health-scl' || riskGroup !== 4);

        if (finalCondition) {
            section.classList.remove('hidden');
            checkbox.disabled = false;
            options.classList.toggle('hidden', !checkbox.checked || checkbox.disabled);
            if (sectionId === 'health-scl' && mainProduct === 'TRON_TAM_AN') {
                checkbox.checked = true;
                checkbox.disabled = true;
                options.classList.remove('hidden');
                const programSelect = section.querySelector('.health-scl-program');
                const scopeSelect = section.querySelector('.health-scl-scope');
                if (programSelect) programSelect.disabled = false;
                if (scopeSelect) scopeSelect.disabled = false;
            }
        } else {
            section.classList.add('hidden');
            checkbox.checked = false;
            checkbox.disabled = true;
            options.classList.add('hidden');
        }

        if (sectionId === 'health-scl' && finalCondition && checkbox.checked) {
            const programSelect = section.querySelector('.health-scl-program');
            if (!programSelect) return;
            programSelect.disabled = false;
            programSelect.querySelectorAll('option').forEach(opt => {
                if (opt.value === '') return;
                if (mainProduct === 'TRON_TAM_AN') {
                    opt.disabled = false;
                } else if (mainPremium >= 15000000) {
                    opt.disabled = false;
                } else if (mainPremium >= 10000000) {
                    opt.disabled = !['co_ban', 'nang_cao', 'toan_dien'].includes(opt.value);
                } else if (mainPremium >= 5000000) {
                    opt.disabled = !['co_ban', 'nang_cao'].includes(opt.value);
                } else {
                    opt.disabled = true;
                }
            });
            if (programSelect.options[programSelect.selectedIndex]?.disabled) {
                programSelect.value = (mainProduct === 'TRON_TAM_AN' || mainPremium >= 5000000) ? 'co_ban' : '';
            }
        }
    };

    const baseCondition = ['PUL_TRON_DOI', 'PUL_15_NAM', 'PUL_5_NAM', 'KHOE_BINH_AN', 'VUNG_TUONG_LAI', 'AN_BINH_UU_VIET', 'TRON_TAM_AN'].includes(mainProduct);

    showOrHide('health-scl', 'health_scl', baseCondition);
    showOrHide('bhn', 'bhn', baseCondition);
    showOrHide('accident', 'accident', baseCondition);
    showOrHide('hospital-support', 'hospital_support', baseCondition);

    if (mainProduct === 'TRON_TAM_AN') {
        ['bhn', 'accident', 'hospital-support'].forEach(id => {
            const section = container.querySelector(`.${id}-section`);
            if (section) {
                section.classList.add('hidden');
                section.querySelector('input[type="checkbox"]').checked = false;
                section.querySelector('.product-options').classList.add('hidden');
            }
        });
    }
}

function renderMainProductOptions(customer) {
    const container = document.getElementById('main-product-options');
    const { mainProduct, age } = customer;
    
    let currentStbh = container.querySelector('#main-stbh')?.value || '';
    let currentPremium = container.querySelector('#main-premium-input')?.value || '';
    let currentPaymentTerm = container.querySelector('#payment-term')?.value || '';
    
    container.innerHTML = '';
    if (!mainProduct) return;

    let optionsHtml = '';
    
    if (mainProduct === 'TRON_TAM_AN') {
        optionsHtml = `<div><label for="main-stbh" class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label><input type="text" id="main-stbh" class="form-input bg-gray-100" value="100.000.000" disabled></div><div><p class="text-sm text-gray-600 mt-1">Thời hạn đóng phí: 10 năm. Thời gian bảo vệ: 10 năm.</p><p class="text-sm text-gray-600 mt-1 font-semibold">Bắt buộc tham gia kèm Sức Khỏe Bùng Gia Lực.</p></div>`;
    } else if (mainProduct === 'AN_BINH_UU_VIET') {
        optionsHtml = `<div><label for="main-stbh" class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label><input type="text" id="main-stbh" class="form-input" value="${currentStbh}" placeholder="VD: 1.000.000.000"></div>`;
        let termOptions = '';
        if (age <= 55) termOptions += '<option value="15">15 năm</option>';
        if (age <= 60) termOptions += '<option value="10">10 năm</option>';
        if (age <= 65) termOptions += '<option value="5">5 năm</option>';
        if (!termOptions) termOptions = '<option value="" disabled>Không có kỳ hạn phù hợp (tuổi vượt quá 65)</option>';
        optionsHtml += `<div><label for="abuv-term" class="font-medium text-gray-700 block mb-1">Thời hạn đóng phí</label><select id="abuv-term" class="form-select">${termOptions}</select><p class="text-sm text-gray-500 mt-1">Thời gian bảo vệ bằng thời hạn đóng phí.</p></div>`;
    } else if (['KHOE_BINH_AN', 'VUNG_TUONG_LAI', 'PUL_TRON_DOI', 'PUL_15_NAM', 'PUL_5_NAM'].includes(mainProduct)) {
        optionsHtml = `<div><label for="main-stbh" class="font-medium text-gray-700 block mb-1">Số tiền bảo hiểm (STBH)</label><input type="text" id="main-stbh" class="form-input" value="${currentStbh}" placeholder="VD: 1.000.000.000"></div>`;
        if (['KHOE_BINH_AN', 'VUNG_TUONG_LAI'].includes(mainProduct)) {
            optionsHtml += `<div><label for="main-premium-input" class="font-medium text-gray-700 block mb-1">Phí sản phẩm chính</label><input type="text" id="main-premium-input" class="form-input" value="${currentPremium}" placeholder="Nhập phí"><div id="mul-fee-range" class="text-sm text-gray-500 mt-1"></div></div>`;
        }
        optionsHtml += `<div><label for="payment-term" class="font-medium text-gray-700 block mb-1">Thời gian đóng phí (năm)</label><input type="number" id="payment-term" class="form-input" value="${currentPaymentTerm}" placeholder="VD: 20" min="${mainProduct === 'PUL_5_NAM' ? 5 : mainProduct === 'PUL_15_NAM' ? 15 : 1}"></div>`;
        // --- THÊM CHỌN KỲ ĐÓNG PHÍ ---
        optionsHtml += `<div><label for="payment-period" class="font-medium text-gray-700 block mb-1">Kỳ đóng phí</label><select id="payment-period" class="form-select"><option value="year">Năm</option><option value="half">Nửa năm</option><option value="quarter">Quý</option></select><p class="text-sm text-gray-500 mt-1">Chọn kỳ đóng phí phù hợp. Phí sẽ được nhân hệ số (Năm x1, Nửa năm x2, Quý x4), làm tròn bội 1.000.</p></div>`;
    }
    
    container.innerHTML = optionsHtml;
}

function calculateMainPremium(customer, ageOverride = null) {
    const ageToUse = ageOverride ?? customer.age;
    const { gender, mainProduct } = customer;
    let premium = 0;

    if (mainProduct.startsWith('PUL') || mainProduct === 'AN_BINH_UU_VIET' || mainProduct === 'TRON_TAM_AN') {
        let stbh = 0;
        let rate = 0;
        const stbhEl = document.getElementById('main-stbh');
        if (stbhEl) stbh = parseFormattedNumber(stbhEl.value);

        if (stbh === 0 && mainProduct !== 'TRON_TAM_AN') {
            if (!ageOverride) document.getElementById('main-product-fee-display').textContent = '';
            return 0;
        }

        const genderKey = gender === 'Nữ' ? 'nu' : 'nam';

        if (mainProduct.startsWith('PUL')) {
            const paymentTermInput = document.getElementById('payment-term');
            const paymentTerm = paymentTermInput ? parseInt(paymentTermInput.value, 10) || 0 : 0;
            if (mainProduct === 'PUL_5_NAM' && paymentTerm < 5) throw new Error('Thời hạn đóng phí cho PUL 5 Năm phải lớn hơn hoặc bằng 5 năm.');
            if (mainProduct === 'PUL_15_NAM' && paymentTerm < 15) throw new Error('Thời hạn đóng phí cho PUL 15 Năm phải lớn hơn hoặc bằng 15 năm.');
            
            const pulRate = product_data.pul_rates[mainProduct]?.find(r => r.age === customer.age)?.[genderKey] || 0;
            if (pulRate === 0 && !ageOverride) throw new Error(`Không có biểu phí PUL cho tuổi ${customer.age}.`);
            rate = pulRate;
        } else if (mainProduct === 'AN_BINH_UU_VIET') {
            const term = document.getElementById('abuv-term')?.value;
            if (!term) return 0;
            const abuvRate = product_data.an_binh_uu_viet_rates[term]?.find(r => r.age === customer.age)?.[genderKey] || 0;
            if (abuvRate === 0 && !ageOverride) {
                throw new Error(`Không có biểu phí An Bình Ưu Việt cho tuổi ${customer.age}, kỳ hạn ${term} năm.`);
            }
            rate = abuvRate;
        } else if (mainProduct === 'TRON_TAM_AN') {
            stbh = 100000000;
            const term = '10';
            const ttaRate = product_data.an_binh_uu_viet_rates[term]?.find(r => r.age === customer.age)?.[genderKey] || 0;
            if (ttaRate === 0 && !ageOverride) {
                throw new Error(`Không có biểu phí Trọn Tâm An cho tuổi ${customer.age}.`);
            }
            rate = ttaRate;
        }
        premium = (stbh / 1000) * rate;
    } else if (['KHOE_BINH_AN', 'VUNG_TUONG_LAI'].includes(mainProduct)) {
        const paymentTermInput = document.getElementById('payment-term');
        const paymentTerm = paymentTermInput ? parseInt(paymentTermInput.value, 10) || 0 : 0;
        if (mainProduct === 'PUL_5_NAM' && paymentTerm < 5) throw new Error('Thời hạn đóng phí cho PUL 5 Năm phải lớn hơn hoặc bằng 5 năm.');
        if (mainProduct === 'PUL_15_NAM' && paymentTerm < 15) throw new Error('Thời hạn đóng phí cho PUL 15 Năm phải lớn hơn hoặc bằng 15 năm.');
        
        if (ageOverride) {
            premium = parseFormattedNumber(document.getElementById('main-premium-input')?.value || '0');
        } else {
            const stbh = parseFormattedNumber(document.getElementById('main-stbh')?.value || '0');
            const factorRow = product_data.mul_factors.find(f => ageToUse >= f.ageMin && ageToUse <= f.ageMax);
            if (!factorRow) throw new Error(`Không có hệ số MUL cho tuổi ${ageToUse}.`);
            
            const minFee = stbh / factorRow.maxFactor;
            const maxFee = stbh / factorRow.minFactor;
            document.getElementById('mul-fee-range').textContent = `Phí hợp lệ từ ${formatCurrency(minFee, '')} đến ${formatCurrency(maxFee, '')}.`;
            
            const enteredPremium = parseFormattedNumber(document.getElementById('main-premium-input')?.value || '0');
            if(stbh > 0 && enteredPremium > 0 && (enteredPremium < minFee || enteredPremium > maxFee)) throw new Error('Phí SP chính nhập vào không hợp lệ.');
            if(stbh > 0 && enteredPremium > 0 && enteredPremium < 5000000) throw new Error('Phí SP chính tối thiểu là 5,000,000.');
            premium = enteredPremium;
        }
    }

    if (!ageOverride) {
        if (premium > 0 && premium < 5000000 && mainProduct !== 'AN_BINH_UU_VIET' && mainProduct !== 'TRON_TAM_AN') {
            throw new Error('Phí SP chính tối thiểu là 5,000,000.');
        }
        document.getElementById('main-product-fee-display').textContent = premium > 0 ? `Phí năm đầu: ${formatCurrency(premium)}` : '';
    }
    return premium;
}

function calculateHealthSclPremium(customer, container, ageOverride = null) {
    const section = container.querySelector('.health-scl-section');
    if (!section || !section.querySelector('.health-scl-checkbox')?.checked) {
        if(section && !ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    const ageToUse = ageOverride ?? customer.age;
    if (ageToUse > MAX_RENEWAL_AGE.health_scl) return 0;
    
    const program = section.querySelector('.health-scl-program').value;
    const scope = section.querySelector('.health-scl-scope').value;
    const hasOutpatient = section.querySelector('.health-scl-outpatient').checked;
    const hasDental = section.querySelector('.health-scl-dental').checked;
    
    const ageBandIndex = product_data.health_scl_rates.age_bands.findIndex(b => ageToUse >= b.min && ageToUse <= b.max);
    if (ageBandIndex === -1) return 0;

    let totalPremium = 0;
    totalPremium += product_data.health_scl_rates[scope]?.[ageBandIndex]?.[program] || 0;
    if (hasOutpatient) totalPremium += product_data.health_scl_rates.outpatient?.[ageBandIndex]?.[program] || 0;
    if (hasDental) totalPremium += product_data.health_scl_rates.dental?.[ageBandIndex]?.[program] || 0;

    if (!ageOverride) section.querySelector('.fee-display').textContent = totalPremium > 0 ? `Phí: ${formatCurrency(totalPremium)}` : '';
    return totalPremium;
}

function calculateBhnPremium(customer, container, ageOverride = null) {
    const section = container.querySelector('.bhn-section');
    if (!section || !section.querySelector('.bhn-checkbox')?.checked) {
        if(section && !ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    const ageToUse = ageOverride ?? customer.age;
    if (ageToUse > MAX_RENEWAL_AGE.bhn) return 0;

    const { gender } = customer;
    const stbh = parseFormattedNumber(section.querySelector('.bhn-stbh')?.value || '0');
    if (stbh === 0) {
        if (!ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    if (stbh > MAX_STBH.bhn) throw new Error(`Số tiền bảo hiểm Bệnh Hiểm Nghèo 2.0 không được vượt quá ${formatCurrency(MAX_STBH.bhn, '')}.`);

    const rate = product_data.bhn_rates.find(r => ageToUse >= r.ageMin && ageToUse <= r.ageMax)?.[gender === 'Nữ' ? 'nu' : 'nam'] || 0;
    const premium = (stbh / 1000) * rate;
    if (!ageOverride) section.querySelector('.fee-display').textContent = `Phí: ${formatCurrency(premium)}`;
    return premium;
}

function calculateAccidentPremium(customer, container, ageOverride = null) {
    const section = container.querySelector('.accident-section');
    if (!section || !section.querySelector('.accident-checkbox')?.checked) {
        if(section && !ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    const ageToUse = ageOverride ?? customer.age;
    if (ageToUse > MAX_RENEWAL_AGE.accident) return 0;
    
    const { riskGroup } = customer;
    if(riskGroup === 0) return 0;
    const stbh = parseFormattedNumber(section.querySelector('.accident-stbh')?.value || '0');
    if (stbh === 0) {
        if (!ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    if (stbh > MAX_STBH.accident) throw new Error(`Số tiền bảo hiểm Tai nạn không được vượt quá ${formatCurrency(MAX_STBH.accident, '')}.`);

    const rate = product_data.accident_rates[riskGroup] || 0;
    const premium = (stbh / 1000) * rate;
    if (!ageOverride) section.querySelector('.fee-display').textContent = `Phí: ${formatCurrency(premium)}`;
    return premium;
}

function calculateHospitalSupportPremium(customer, mainPremium, container, totalHospitalSupportStbh = 0, ageOverride = null) {
    const section = container.querySelector('.hospital-support-section');
    if (!section || !section.querySelector('.hospital-support-checkbox')?.checked) {
        if(section && !ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    const ageToUse = ageOverride ?? customer.age;
    if (ageToUse > MAX_RENEWAL_AGE.hospital_support) return 0;
    
    const totalMaxSupport = Math.floor(mainPremium / 4000000) * 100000;
    const maxSupportByAge = ageToUse >= 18 ? 1_000_000 : 300_000;
    const remainingSupport = totalMaxSupport - totalHospitalSupportStbh;

    if (!ageOverride) {
        section.querySelector('.hospital-support-validation').textContent = 
            `Tối đa: ${formatCurrency(Math.min(maxSupportByAge, remainingSupport), 'đ/ngày')}. Phải là bội số của 100.000.`;
    }

    const stbh = parseFormattedNumber(section.querySelector('.hospital-support-stbh')?.value || '0');
    if (stbh === 0) {
        if (!ageOverride) section.querySelector('.fee-display').textContent = '';
        return 0;
    }
    if (stbh > maxSupportByAge) {
        throw new Error(`Số tiền Hỗ trợ viện phí vượt quá giới hạn theo tuổi: ${formatCurrency(maxSupportByAge, 'đ/ngày')}.`);
    }
    if (stbh > remainingSupport || stbh % 100000 !== 0) {
        throw new Error(`Số tiền Hỗ trợ viện phí không hợp lệ. Tối đa còn lại: ${formatCurrency(remainingSupport, 'đ/ngày')}. Phải là bội số của 100.000.`);
    }
    
    const rate = product_data.hospital_fee_support_rates.find(r => ageToUse >= r.ageMin && ageToUse <= r.ageMax)?.rate || 0;
    const premium = (stbh / 100) * rate;
    if (!ageOverride) section.querySelector('.fee-display').textContent = `Phí: ${formatCurrency(premium)}`;
    return premium;
}

function updateSummaryUI(premiums) {
    document.getElementById('main-premium-result').textContent = formatCurrency(premiums.mainPremium);

    const suppContainer = document.getElementById('supplementary-premiums-results');
    suppContainer.innerHTML = '';
    if(premiums.totalSupplementaryPremium > 0) {
        suppContainer.innerHTML = `<div class="flex justify-between items-center py-2 border-b"><span class="text-gray-600">Tổng phí SP bổ sung:</span><span class="font-bold text-gray-900">${formatCurrency(premiums.totalSupplementaryPremium)}</span></div>`;
    }

    document.getElementById('total-premium-result').textContent = formatCurrency(premiums.totalPremium);
}

// ... giữ nguyên các hàm generateSummaryTable, exportToHTML, sanitizeHtml, generateSupplementaryPersonHtml, generateSupplementaryProductsHtml ...
// ... các hàm này không liên quan đến nghiệp vụ kỳ đóng phí, format tiền, nên không cần thay đổi ...

function showError(message) {
    document.getElementById('error-message').textContent = message;
}
function clearError() {
    document.getElementById('error-message').textContent = '';
}
