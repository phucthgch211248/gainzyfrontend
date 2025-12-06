import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { uploadImages } from '../../lib/cloudinary';
import { toArray } from '../../lib/normalize';
import { ShoppingBag, Upload, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';

function isObjectId(v) {
  return /^[a-fA-F0-9]{24}$/.test((v || '').trim());
}

const EFFECT_OPTIONS = [
  { label: 'Muscle Gain', icon: '/images/menu_icon_2_1.png' },
  { label: 'Fat Loss', icon: '/images/menu_icon_2_2.png' },
  { label: 'Bones & Joints', icon: '/images/menu_icon_2_3.webp' },
  { label: 'Weight Gain', icon: '/images/menu_icon_2_4.webp' },
  { label: 'Skin, Hair & Nails', icon: '/images/menu_icon_2_5.png' },
  { label: 'Liver Protection', icon: '/images/menu_icon_2_6.png' },
  { label: 'Sleep', icon: '/images/menu_icon_2_7.png' },
  { label: 'Cardiovascular Support', icon: '/images/menu_icon_2_8.png' },
  { label: 'Blood Sugar Control', icon: '/images/menu_icon_2_9.png' },
];

export default function AdminCreateProduct() {
  const [form, setForm] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    category: '',
    brand: ''
  });
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, brs] = await Promise.all([
          api.categories.list('?limit=1000').catch(() => []),
          api.brands.list('?limit=1000').catch(() => []),
        ]);
        setCategories(toArray(cats));
        setBrands(toArray(brs));
      } catch {}
    })();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Cộng dồn file mới với các file đã chọn trước đó
    const allFiles = [...files, ...selectedFiles];
    setFiles(allFiles);

    // Chỉ tạo preview cho các file mới và append vào previews hiện tại
    const readers = selectedFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((newPreviews) => {
      setPreviews((prev) => [...prev, ...newPreviews]);
    });
  };

  const removeImage = (index) => {
    const newFiles = Array.from(files).filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const toggleEffect = (label) => {
    setSelectedEffects((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const clearEffects = () => setSelectedEffects([]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const errors = [];
      const name = (form.name || '').trim();
      const description = (form.description || '').trim();
      const price = Number(form.price);
      const stock = Number(form.stock);
      const category = (form.category || '').trim();
      const brand = (form.brand || '').trim();

      if (!name) errors.push('Product name is required');
      if (!description) errors.push('Product description is required');
      if (!price || price <= 0) errors.push('Product price must be greater than 0');
      if (!category || !isObjectId(category)) errors.push('Invalid category');
      if (!brand || !isObjectId(brand)) errors.push('Invalid brand');
      if (Number.isNaN(stock) || stock < 0) errors.push('Invalid stock quantity');

      const effective = (selectedEffects || [])
        .map((lbl) => EFFECT_OPTIONS.find((o) => o.label === lbl))
        .filter(Boolean)
        .map((o) => ({ label: o.label, icon: o.icon }));

      if (effective !== undefined) {
        if (!Array.isArray(effective)) errors.push('Effective field must be an array');
        else if (
          effective.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))
        ) {
          errors.push('Each element in effective must be a valid object');
        }
      }

      if (errors.length > 0) {
        const err = new Error('Invalid data');
        err.errors = errors;
        throw err;
      }

      const imageUrls = await uploadImages(files);
      const payload = {
        name,
        description,
        price,
        stock,
        category,
        brand,
        images: imageUrls,
        ...(effective.length > 0 ? { effective } : {}),
      };
      await api.products.create(payload);

      setSuccess(true);
      setForm({ name: '', price: 0, stock: 0, description: '', category: '', brand: '' });
      setSelectedEffects([]);
      setFiles([]);
      setPreviews([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err?.errors?.join(', ') || err.message || 'An error occurred';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Product
          </h1>
          <p className="text-gray-600">Add a new product to your store</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <p className="text-green-800 font-medium">Product created successfully! 🎉</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Product Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Enter product name..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Price (USD)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={onChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={onChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-white"
                >
                  <option value="">-- Select category --</option>
                  {(categories || []).map((c) => (
                    <option key={c._id || c.id || c.slug || c.name} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Brand</label>
                <select
                  name="brand"
                  value={form.brand}
                  onChange={onChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none bg-white"
                >
                  <option value="">-- Select brand --</option>
                  {(brands || []).map((b) => (
                    <option key={b._id || b.id || b.slug || b.name} value={b._id || b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Product Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={4}
                placeholder="Enter detailed product description..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-200 bg-white resize-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">Effects (optional)</label>
                {selectedEffects.length > 0 && (
                  <button type="button" onClick={clearEffects} className="text-xs px-2 py-1 border rounded-lg">Clear</button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EFFECT_OPTIONS.map((opt) => {
                  const active = selectedEffects.includes(opt.label);
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => toggleEffect(opt.label)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                    >
                      <img src={opt.icon} alt={opt.label} className="w-8 h-8 rounded" />
                      <span className={`text-sm font-medium ${active ? 'text-purple-700' : 'text-gray-700'}`}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedEffects.length === 0 && (
                <p className="text-xs text-gray-500">Leave empty if not needed. You can select multiple items.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Product Images (Multiple)</label>
              <div className="relative">
                <input type="file" accept="image/*" multiple onChange={onFilesChange} className="hidden" id="files-upload" />
                <label htmlFor="files-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-purple-50 group">
                  <Upload className="w-10 h-10 text-gray-400 group-hover:text-purple-500 transition-colors mb-2" />
                  <p className="text-sm text-gray-600 group-hover:text-purple-600 font-medium">Click to upload multiple images</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF - Select multiple files at once</p>
                </label>
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-500" />
                  {files.length} image{files.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating product...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Create Product
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
