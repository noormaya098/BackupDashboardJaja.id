# Dokumentasi Fitur Banner Management

## 📋 Ringkasan
Saya telah membuat fitur banner management lengkap untuk aplikasi Anda dengan antarmuka yang user-friendly, terinspirasi dari struktur halaman `order.jsx`.

## 📁 File-file yang Dibuat

### 1. **Banner List** (`/src/pages/banner/bannerList.jsx`)
Halaman utama untuk menampilkan daftar semua banner dalam format card grid.

**Fitur:**
- ✅ Menampilkan banner dalam grid layout yang responsif (1 kolom mobile, 2 kolom tablet, 3 kolom desktop)
- ✅ Preview gambar banner di setiap card
- ✅ Menampilkan informasi: Link, Type, Sort, dan Status (Aktif/Tidak Aktif)
- ✅ Tombol "Tambah Banner" untuk membuat banner baru
- ✅ Action buttons untuk setiap banner:
  - **Detail** - Lihat informasi lengkap banner
  - **Edit** - Edit banner (fetch detail terlebih dahulu)
  - **Toggle** - Toggle status aktif/tidak aktif (Aktif di Platform)
  - **Hapus** - Hapus banner dengan konfirmasi

**API yang Digunakan:**
- GET `https://apidev.jaja.id/nimda/banner-slider` - Fetch daftar banner
- PATCH `https://apidev.jaja.id/nimda/banner-slider/{id}` - Toggle status
- DELETE `https://apidev.jaja.id/nimda/banner-slider/{id}` - Hapus banner

---

### 2. **Add Banner** (`/src/pages/banner/addBanner.jsx`)
Halaman untuk membuat banner baru dengan form yang lengkap.

**Fitur:**
- ✅ Upload gambar banner (hanya file gambar yang diterima)
- ✅ Input field untuk Link
- ✅ Select dropdown untuk Type Web (Web, Mobile, Desktop)
- ✅ Input number untuk Urutan (Sort) - 1-100
- ✅ Toggle switch untuk Aktif di Platform (is_platform)
- ✅ Toggle switch untuk Status
- ✅ Tombol Submit untuk menyimpan banner

**API yang Digunakan:**
- POST `https://apidev.jaja.id/seller/v2/banner` - Tambah banner baru

**Request Body (FormData):**
```javascript
{
  banner: File,           // Image file
  link: string,          // URL link
  type_web: string,      // 'web', 'mobile', 'desktop'
  is_platform: 0 | 1,    // Active/Inactive di platform
  status: 0 | 1,         // Active/Inactive status umum
  sort: number           // Order 1-100
}
```

---

### 3. **Edit Banner** (`/src/pages/banner/editBanner.jsx`)
Halaman untuk mengedit banner yang sudah ada.

**Fitur:**
- ✅ Fetch detail banner terlebih dahulu sebelum menampilkan form
- ✅ Pre-fill form dengan data banner yang ada
- ✅ Preview gambar lama jika ada
- ✅ Opsi untuk mengganti gambar (opsional)
- ✅ Edit Link, Type Web, Sort, Status
- ✅ Tombol Submit untuk menyimpan perubahan
- ✅ Konfirmasi sebelum meninggalkan halaman

**API yang Digunakan:**
- GET `https://apidev.jaja.id/nimda/banner-slider/{id}` - Fetch detail banner
- PUT `https://apidev.jaja.id/nimda/banner-slider/{id}` - Update banner

---

### 4. **Detail Banner** (`/src/pages/banner/detailBanner.jsx`)
Halaman untuk melihat detail lengkap banner.

**Fitur:**
- ✅ Fetch detail banner
- ✅ Menampilkan gambar banner dalam ukuran penuh
- ✅ Informasi lengkap dalam format descriptions:
  - ID
  - Link (clickable)
  - Type Web
  - Urutan (Sort)
  - Status Aktif
  - Status Umum
  - Tanggal Dibuat
  - Tanggal Diperbarui
- ✅ Tombol Edit dan Hapus

**API yang Digunakan:**
- GET `https://apidev.jaja.id/nimda/banner-slider/{id}` - Fetch detail banner
- DELETE `https://apidev.jaja.id/nimda/banner-slider/{id}` - Hapus banner

---

## 🔄 Route Configuration

### Routes Ditambahkan di `/src/routes.jsx`:
```javascript
{
  title: 'Manajemen Konten',
  layout: "dashboard",
  pages: [
    {
      icon: <PhotoIcon {...icon} />,
      name: "Banner",
      path: "/banner",
      element: <BannerList />,
    },
  ],
},
```

### Sub-routes di `/src/App.jsx`:
```javascript
<Route path="banner/add" element={<AddBanner />} />
<Route path="banner/edit/:id" element={<EditBanner />} />
<Route path="banner/detail/:id" element={<DetailBanner />} />
```

---

## 🎨 UI Design Details

### Layout & Styling
- Menggunakan Ant Design components (Card, Button, Form, Upload, Select, Switch, Modal, etc.)
- Tailwind CSS untuk responsive design
- Consistent styling dengan aplikasi yang ada
- Color scheme:
  - Primary actions: Blue (#007BFF)
  - Success: Green (#28A745)
  - Danger: Red
  - Secondary: Gray/Orange

### Responsive Design
- Mobile: 1 kolom (w-full)
- Tablet: 2 kolom (sm:grid-cols-2)
- Desktop: 3 kolom (lg:grid-cols-3)

### Form Validation
- Link: Required
- Type Web: Required
- Sort: Required, min 1, max 100
- File upload: Image format only
- File size: Unlimited (sesuai backend)

---

## 🔐 Authentication
Semua API calls dilengkapi dengan token authentication:
```javascript
headers: {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}
```

---

## 📊 API Response Format
Aplikasi mengharapkan API responses dalam format:
```javascript
{
  code: 200,          // Success code
  data: [],           // Data array or object
  message: "string",  // Optional message
  success: boolean    // Optional success flag
}
```

---

## ⚙️ Features Implemented

### Data Management
- ✅ Fetch list banner dengan pagination support
- ✅ Fetch detail banner sebelum edit
- ✅ Create banner dengan upload image
- ✅ Update banner dengan optional image replacement
- ✅ Delete banner dengan konfirmasi

### Status Management
- ✅ Toggle status aktif/tidak aktif (is_platform)
- ✅ Display status dengan color-coded tags
- ✅ Real-time status update di list setelah toggle

### File Upload
- ✅ Upload image sebagai FormData
- ✅ File validation (image only)
- ✅ Preview image di add dan edit
- ✅ Fallback placeholder untuk image gagal load

### User Experience
- ✅ Loading states untuk fetch data
- ✅ Success/error notifications
- ✅ Confirmation dialogs untuk delete
- ✅ Navigation breadcrumb (Kembali button)
- ✅ Empty state message

---

## 📱 Menu Structure

Di sidebar navigation, banner tersedia di section baru "Manajemen Konten" dengan icon Photo.

Navigation structure:
```
Dashboard
├── Beranda
├── Katalog
│   ├── Order
│   ├── Pengajuan
│   ├── Purchase
│   ├── Receive Notes
│   ├── Delivery Order
│   ├── Invoice
│   └── Purchase Invoice
├── Manajemen Konten
│   └── Banner        ← BARU
└── Dan Lain-Lain
    ├── Vendor
    ├── Customers
    ├── Warehouse
    ├── Inventory
    └── Product
```

---

## 🚀 Testing Checklist

- [ ] Buka `/dashboard/banner` untuk melihat list banner
- [ ] Klik "Tambah Banner" untuk membuat banner baru
- [ ] Upload gambar, isi form, dan simpan
- [ ] Klik "Edit" pada banner untuk mengedit
- [ ] Klik "Toggle" untuk mengubah status aktif/tidak aktif
- [ ] Klik "Detail" untuk melihat informasi lengkap
- [ ] Klik "Hapus" dan konfirmasi untuk menghapus banner
- [ ] Verifikasi semua API calls berhasil di Network tab DevTools

---

## 📝 Notes

1. **Token Management**: Pastikan token valid tersimpan di localStorage dengan key 'token'
2. **API Base URL**: Semua API calls menggunakan base URL `https://apidev.jaja.id/`
3. **Image Upload**: FormData digunakan untuk multipart/form-data requests
4. **Error Handling**: Semua API calls memiliki error handling dengan user-friendly messages
5. **Mobile Responsive**: Semua halaman fully responsive untuk mobile devices

---

## 🔗 Reference
Desain mengikuti pattern dan struktur yang sama dengan `order.jsx`:
- Status mapping dan color-coding
- Table/Grid layout
- Action buttons pattern
- Modal confirmation
- Form handling
- API error handling
- Loading states

