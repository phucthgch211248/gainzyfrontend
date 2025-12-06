import { useState } from 'react';
import { api } from '../../lib/apiClient';
import { uploadImage } from '../../lib/cloudinary';
import { Layers, Upload, Loader2, Check } from 'lucide-react';

export default function AdminCreateCategory() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFileChange = (e) => {
    const fileList = Array.from(e.target.files || []);
    setFiles(fileList);

    if (fileList.length > 0) {
      const readers = fileList.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      );

      Promise.all(readers).then((results) => {
        setPreviews(results);
      });
    } else {
      setPreviews([]);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const errors = [];
      const name = (form.name || '').trim();
      const description = (form.description || '').trim();

      if (!name) {
        errors.push('Category name is required');
      } else if (name.length < 2) {
        errors.push('Category name must be at least 2 characters');
      } else if (name.length > 100) {
        errors.push('Category name must not exceed 100 characters');
      }

      if (description && description.length > 500) {
        errors.push('Description must not exceed 500 characters');
      }

      if (errors.length > 0) {
        const error = new Error('Invalid data');
        error.errors = errors;
        throw error;
      }

      let images = [];
      if (files.length > 0) {
        images = await Promise.all(files.map((f) => uploadImage(f)));
      }

      const payload = {
        name,
        ...(description ? { description } : {}),
        ...(images.length > 0 ? { images: images.map((url) => url.trim()) } : {}),
      };

      await api.categories.create(payload);

      setSuccess(true);
      setForm({ name: '', description: '' });
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Create New Category
          </h1>
          <p className="text-gray-600">Add a new product category to the system</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <p className="text-green-800 font-medium">Category created successfully! 🎉</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Category Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                placeholder="Enter category name..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all duration-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Enter category description (max 500 characters)..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all duration-200 bg-white min-h-[100px] resize-y"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">Max 500 characters</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Images (can select multiple)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  className="hidden"
                  id="file-upload-category"
                />
                <label
                  htmlFor="file-upload-category"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-500 transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-teal-50 group"
                >
                  {previews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 w-full h-full p-2 overflow-y-auto">
                      {previews.map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 group-hover:text-teal-500 transition-colors mb-2" />
                      <p className="text-sm text-gray-600 group-hover:text-teal-600 font-medium">
                        Click to upload images (can select multiple)
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF max 10MB per image</p>
                    </>
                  )}
                </label>
              </div>
              {files.length > 0 && (
                <p className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>
                    {files.length} image{files.length > 1 ? 's' : ''} selected:{' '}
                    {files
                      .map((f) => f.name)
                      .slice(0, 3)
                      .join(', ')}
                    {files.length > 3 ? ` and ${files.length - 3} more` : ''}
                  </span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Layers className="w-5 h-5" />
                  Create Category
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
