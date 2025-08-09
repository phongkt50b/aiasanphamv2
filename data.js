export const product_data = {
    occupations: [
        { name: "-- Chọn nghề nghiệp --", group: 0 },
        { name: "Quản lý nhà hàng/khách sạn quy mô lớn, quốc tế", group: 1 },
        { name: "Quản lý, điều hành", group: 1 },
        { name: "Quản lý dịch vụ vệ sinh", group: 1 },
        { name: "Kiến trúc sư", group: 1 },
        { name: "Thiết kế", group: 1 },
        { name: "Kỹ sư xây dựng (văn phòng)", group: 1 },
        { name: "Nhân viên văn phòng/Giám đốc/Quản lý nhà máy", group: 1 },
        { name: "Ban giám đốc", group: 1 },
        { name: "Nhân viên văn phòng", group: 1 },
        { name: "Kỹ sư công nghệ thông tin", group: 1 },
        { name: "Nghiên cứu, đào tạo, hướng dẫn (Nông Lâm Ngư)", group: 1 },
        { name: "Tác giả truyện, thơ, văn", group: 1 },
        { name: "Quản lý/Tổng biên tập", group: 1 },
        { name: "Tư vấn luật/Luật sư/Thẩm phán/Công tố viên", group: 1 },
        { name: "Cấp lãnh đạo, chỉ huy (Tư pháp/Quân đội)", group: 1 },
        { name: "Trẻ em", group: 1 },
        { name: "Tu hành/Thầy cúng/Thầy phong thủy", group: 1 },
        { name: "Chủ dịch vụ cho thuê", group: 2 },
        { name: "Chủ/Quản lý nhà hàng, khách sạn quy mô nhỏ", group: 2 },
        { name: "Buôn bán, kinh doanh tại địa điểm cố định", group: 2 },
        { name: "Tư vấn, môi giới, Đại lý bảo hiểm", group: 2 },
        { name: "Nhân viên kinh doanh, bán hàng", group: 2 },
        { name: "Nhân viên kinh doanh tín dụng", group: 2 },
        { name: "Thợ làm tóc/Làm móng/Trang điểm/Chủ cơ sở", group: 2 },
        { name: "Kỹ sư môi trường", group: 2 },
        { name: "Quản lý, giám sát công trình", group: 2 },
        { name: "Quản đốc, đốc công", group: 2 },
        { name: "Hướng dẫn viên du lịch", group: 2 },
        { name: "Sĩ quan không thuộc đặc công/đặc nhiệm", group: 2 },
        { name: "Hưu trí", group: 2 },
        { name: "Nội trợ", group: 2 },
        { name: "Sinh viên", group: 2 },
        { name: "Buôn bán, kinh doanh lưu động", group: 3 },
        { name: "Nhân viên làm việc trạm xăng dầu", group: 3 },
        { name: "Giúp việc nhà", group: 3 },
        { name: "Pha chế", group: 3 },
        { name: "Tiếp viên hàng không", group: 3 },
        { name: "Phi công máy bay thương mại", group: 3 },
        { name: "Sản xuất bao bì, Dệt may, Giày dép", group: 3 },
        { name: "Chế biến thủy sản/nông sản", group: 3 },
        { name: "Nuôi trồng thủy hải sản", group: 3 },
        { name: "Làm ruộng/Trồng trọt/Chăn nuôi", group: 3 },
        { name: "Biểu diễn lưu động", group: 3 },
        { name: "Thi hành án", group: 3 },
        { name: "Nhân viên/Thợ lắp đặt, sửa chữa, bảo trì", group: 4 },
        { name: "Công nhân chăm sóc cây xanh", group: 4 },
        { name: "Công nhân vệ sinh đường phố, công cộng", group: 4 },
        { name: "Nhân viên giao hàng/Bưu tá", group: 4 },
        { name: "Đầu bếp, thợ nấu", group: 4 },
        { name: "Tài xế xe buýt/khách/tải/xe máy", group: 4 },
        { name: "Công nhân cơ khí, Thợ máy", group: 4 },
        { name: "Công nhân xây dựng, thi công, Thợ hồ", group: 4 },
        { name: "Đánh bắt cá ở sông hồ", group: 4 },
        { name: "Lao động tự do", group: 4 }
    ],
    pul_rates: {
        // ... dữ liệu phí sản phẩm chính cho từng tuổi/giới tính ...
        // (giữ nguyên như dữ liệu gốc, vì đã chuẩn nghiệp vụ)
        PUL_TRON_DOI: [
            // ... danh sách biểu phí ...
        ],
        PUL_15_NAM: [
            // ... danh sách biểu phí ...
        ],
        PUL_5_NAM: [
            // ... danh sách biểu phí ...
        ]
    },
    an_binh_uu_viet_rates: {
        // ... dữ liệu phí An Bình Ưu Việt cho 5, 10, 15 năm từng tuổi/giới tính ...
        5: [ /* ... */ ],
        10: [ /* ... */ ],
        15: [ /* ... */ ]
    },
    mul_factors: [
        { ageMin: 0, ageMax: 9, minFactor: 55, maxFactor: 150 },
        { ageMin: 10, ageMax: 16, minFactor: 45, maxFactor: 150 },
        { ageMin: 17, ageMax: 19, minFactor: 40, maxFactor: 150 },
        { ageMin: 20, ageMax: 29, minFactor: 35, maxFactor: 140 },
        { ageMin: 30, ageMax: 34, minFactor: 25, maxFactor: 120 },
        { ageMin: 35, ageMax: 39, minFactor: 20, maxFactor: 100 },
        { ageMin: 40, ageMax: 44, minFactor: 20, maxFactor: 70 },
        { ageMin: 45, ageMax: 49, minFactor: 20, maxFactor: 50 },
        { ageMin: 50, ageMax: 54, minFactor: 15, maxFactor: 40 },
        { ageMin: 55, ageMax: 59, minFactor: 8, maxFactor: 20 },
        { ageMin: 60, ageMax: 70, minFactor: 5, maxFactor: 10 }
    ],
    bhn_rates: [
        // ... dữ liệu phí BHN 2.0 ...
    ],
    health_scl_rates: {
        age_bands: [
            { min: 0, max: 4 }, { min: 5, max: 9 }, { min: 10, max: 14 }, { min: 15, max: 19 }, { min: 20, max: 24 }, { min: 25, max: 29 }, { min: 30, max: 34 }, { min: 35, max: 39 }, { min: 40, max: 44 }, { min: 45, max: 49 }, { min: 50, max: 54 }, { min: 55, max: 59 }, { min: 60, max: 64 }, { min: 65, max: 65 }, { min: 66, max: 69 }, { min: 70, max: 74 }
        ],
        main_vn: [ /* ... */ ],
        main_global: [ /* ... */ ],
        outpatient: [ /* ... */ ],
        dental: [ /* ... */ ]
    },
    accident_rates: { 1: 3.37, 2: 4.54, 3: 8.37, 4: 12.16 },
    hospital_fee_support_rates: [
        { ageMin: 1, ageMax: 4, rate: 181 },
        { ageMin: 5, ageMax: 34, rate: 155 },
        { ageMin: 35, ageMax: 39, rate: 189 },
        { ageMin: 40, ageMax: 44, rate: 230 },
        { ageMin: 45, ageMax: 55, rate: 398 },
        { ageMin: 56, ageMax: 59, rate: 398 }
    ]
};
