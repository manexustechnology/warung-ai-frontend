import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { useApiStore } from '../../store/apiStore';
import { Product } from '../../types';
import { compressImage } from '../../utils/imageCompression';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addProduct, updateProduct } = useApiStore();
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    price: '',
    category: '',
    stock: '',
    barcode: '',
    image: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        nameEn: product.nameEn || '',
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        barcode: product.barcode || '',
        image: product.image || '',
        buyPrice: (product as any).buyPrice ? String(product.buyPrice) : '' as any,
      } as any);
      setImagePreview(product.image || '');
    } else {
      setFormData({
        name: '',
        nameEn: '',
        price: '',
        category: '',
        stock: '',
        barcode: '',
        image: '',
        buyPrice: '' as any,
      } as any);
      setImagePreview('');
    }
    setImageFile(null);
  }, [product]);

  if (!isOpen) return null;

  const handleImageUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedImage = await compressImage(file, 10); // Compress to 10KB
      setImagePreview(compressedImage);
      setFormData({ ...formData, image: compressedImage });
      setImageFile(file);
    } catch (error) {
      console.error('Failed to compress image:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File terlalu besar. Maksimal 5MB.');
        return;
      }
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData({ ...formData, image: '' });
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      nameEn: formData.nameEn || undefined,
      price: parseFloat(formData.price),
      ...(formData as any).buyPrice ? { buyPrice: parseFloat((formData as any).buyPrice) } : {},
      category: formData.category,
      stock: parseInt(formData.stock),
      barcode: formData.barcode || undefined,
      image: formData.image || undefined,
    };

    try {
      if (product) {
        await updateProduct(product.id, productData);
      } else {
        await addProduct(productData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      // Error handling is done in the store functions with toast messages
    }
  };

  const categories = [
    'Sembako',
    'Makanan',
    'Minuman',
    'Snack',
    'Kebutuhan Rumah',
    'Lainnya',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Masukkan nama produk"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk (English)
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Product name in English"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Jual *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Beli (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={(formData as any).buyPrice || ''}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value } as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stok *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Scan atau masukkan barcode"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Produk
            </label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isCompressing}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {isCompressing ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">
                        {isCompressing ? 'Mengompresi gambar...' : 'Klik untuk upload gambar'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Maksimal 5MB, akan dikompresi ke 10KB
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-500 text-white rounded-lg py-3 px-4 font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{product ? 'Update' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};