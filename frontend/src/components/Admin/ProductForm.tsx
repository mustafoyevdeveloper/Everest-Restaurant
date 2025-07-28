import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tabs as LangTabs, TabsList as LangTabsList, TabsTrigger as LangTabsTrigger, TabsContent as LangTabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon,
  UtensilsCrossed,
  FileText,
  Settings,
  Tag
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebaseConfig';
import { useTranslation } from 'react-i18next';

interface ProductType {
  name: string;
  price: number;
  description?: string;
}

interface Ingredient {
  name: string;
  description?: string;
}

interface ProductFormData {
  nameKey: string;
  descriptionKey: string;
  price: string;
  image: string;
  category: string;
  rating: number;
  quantity: string;
  isAvailable: boolean;
  fullDescription: string;
  types: ProductType[];
  ingredients: Ingredient[];
  preparationMethod: string;
  preparationTime: string;
  calories: string;
  allergens: string[];
  tags: string[];
  additionalImages: string[];
  metaTitle: string;
  metaDescription: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const LANGS = [
  { code: 'uz', label: 'uz' },
  { code: 'ru', label: 'ru' },
  { code: 'en', label: 'en' }
];

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState('uz');
  const [multiLang, setMultiLang] = useState({
    uz: { name: initialData?.name_uz || '', description: initialData?.description_uz || '' },
    ru: { name: initialData?.name_ru || '', description: initialData?.description_ru || '' },
    en: { name: initialData?.name_en || '', description: initialData?.description_en || '' }
  });

  const [formData, setFormData] = useState<ProductFormData>({
    nameKey: initialData?.nameKey || '',
    descriptionKey: initialData?.descriptionKey || '',
    price: initialData?.price || '',
    image: initialData?.image || '',
    category: initialData?.category || '',
    rating: initialData?.rating || 4.5,
    quantity: initialData?.quantity || '',
    isAvailable: initialData?.isAvailable ?? true,
    fullDescription: initialData?.fullDescription || '',
    types: initialData?.types || [],
    ingredients: initialData?.ingredients || [],
    preparationMethod: initialData?.preparationMethod || '',
    preparationTime: initialData?.preparationTime || '15',
    calories: initialData?.calories || '',
    allergens: initialData?.allergens || [],
    tags: initialData?.tags || [],
    additionalImages: initialData?.additionalImages || [],
    metaTitle: initialData?.metaTitle || '',
    metaDescription: initialData?.metaDescription || ''
  });

  const [uploading, setUploading] = useState(false);
  const [newAdditionalImage, setNewAdditionalImage] = useState('');

  const categories = [
    { value: 'appetizers', label: t('menu_category_appetizers') },
    { value: 'main_courses', label: t('menu_category_main_courses') },
    { value: 'desserts', label: t('menu_category_desserts') },
    { value: 'beverages', label: t('menu_category_beverages') },
    { value: 'pizza', label: t('menu_category_pizza') },
    { value: 'pasta', label: t('menu_category_pasta') },
    { value: 'salads', label: t('menu_category_salads') },
    { value: 'seafood', label: t('menu_category_seafood') },
    { value: 'steaks', label: t('menu_category_steaks') },
    { value: 'soups', label: t('menu_category_soups') },
    { value: 'grilled', label: t('menu_category_grilled') },
    { value: 'vegan', label: t('menu_category_vegan') },
    { value: 'sushi', label: t('menu_category_sushi') },
    { value: 'sandwiches', label: t('menu_category_sandwiches') },
    { value: 'breakfast', label: t('menu_category_breakfast') },
    { value: 'kids', label: t('menu_category_kids') },
    { value: 'specials', label: t('menu_category_specials') },
    { value: 'cocktails', label: t('menu_category_cocktails') },
    { value: 'smoothies', label: t('menu_category_smoothies') }
  ];

  const allergenOptions = [
    { value: 'gluten', label: t('admin.products.form.allergens.gluten') },
    { value: 'dairy', label: t('admin.products.form.allergens.dairy') },
    { value: 'nuts', label: t('admin.products.form.allergens.nuts') },
    { value: 'eggs', label: t('admin.products.form.allergens.eggs') },
    { value: 'soy', label: t('admin.products.form.allergens.soy') },
    { value: 'fish', label: t('admin.products.form.allergens.fish') },
    { value: 'shellfish', label: t('admin.products.form.allergens.shellfish') },
    { value: 'wheat', label: t('admin.products.form.allergens.wheat') },
    { value: 'peanuts', label: t('admin.products.form.allergens.peanuts') },
    { value: 'tree_nuts', label: t('admin.products.form.allergens.tree_nuts') }
  ];

  const tagOptions = [
    { value: 'spicy', label: t('admin.products.form.tags.spicy') },
    { value: 'vegetarian', label: t('admin.products.form.tags.vegetarian') },
    { value: 'vegan', label: t('admin.products.form.tags.vegan') },
    { value: 'gluten_free', label: t('admin.products.form.tags.gluten_free') },
    { value: 'dairy_free', label: t('admin.products.form.tags.dairy_free') },
    { value: 'organic', label: t('admin.products.form.tags.organic') },
    { value: 'local', label: t('admin.products.form.tags.local') },
    { value: 'seasonal', label: t('admin.products.form.tags.seasonal') },
    { value: 'chef_special', label: t('admin.products.form.tags.chef_special') },
    { value: 'popular', label: t('admin.products.form.tags.popular') },
    { value: 'new', label: t('admin.products.form.tags.new') }
  ];

  const handleMultiLangChange = (lang: string, field: keyof ProductFormData, value: any) => {
    setMultiLang(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }));
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Agar mahsulot mavjud emas qilib qo'yilsa, miqdorni 0 ga teng qilish
      if (field === 'isAvailable' && value === false) {
        newData.quantity = '0';
      }
      
      return newData;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'additionalImages') => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.url) {
        if (field === 'image') {
          handleInputChange('image', data.url);
        } else {
          handleInputChange('additionalImages', [...formData.additionalImages, data.url]);
        }
        toast({
          title: t('admin.products.form.toast.successTitle'),
          description: t('admin.products.form.toast.imageUploadSuccess'),
        });
      } else {
        throw new Error('Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: t('admin.products.form.toast.errorTitle'),
        description: t('admin.products.form.toast.errorDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const addProductType = () => {
    const newType: ProductType = { name: '', price: 0 };
    handleInputChange('types', [...formData.types, newType]);
  };

  const updateProductType = (index: number, field: keyof ProductType, value: any) => {
    const updatedTypes = [...formData.types];
    updatedTypes[index] = { ...updatedTypes[index], [field]: value };
    handleInputChange('types', updatedTypes);
  };

  const removeProductType = (index: number) => {
    handleInputChange('types', formData.types.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    const newIngredient: Ingredient = { name: '' };
    handleInputChange('ingredients', [...formData.ingredients, newIngredient]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    handleInputChange('ingredients', updatedIngredients);
  };

  const removeIngredient = (index: number) => {
    handleInputChange('ingredients', formData.ingredients.filter((_, i) => i !== index));
  };

  const toggleAllergen = (allergen: string) => {
    const updated = formData.allergens.includes(allergen)
      ? formData.allergens.filter(a => a !== allergen)
      : [...formData.allergens, allergen];
    handleInputChange('allergens', updated);
  };

  const toggleTag = (tag: string) => {
    const updated = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    handleInputChange('tags', updated);
  };

  const removeAdditionalImage = (index: number) => {
    handleInputChange('additionalImages', formData.additionalImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: at least one language must have name and description
    const hasAnyLang = LANGS.some(l => multiLang[l.code].name && multiLang[l.code].description);
    if (!hasAnyLang || !formData.price || !formData.image || !formData.category) {
      toast({
        title: t('admin.products.form.toast.errorTitle'),
        description: t('admin.products.form.toast.errorDescription'),
        variant: 'destructive'
      });
      return;
    }

    const submitData = {
      ...formData,
      name_uz: multiLang.uz.name,
      description_uz: multiLang.uz.description,
      name_ru: multiLang.ru.name,
      description_ru: multiLang.ru.description,
      name_en: multiLang.en.name,
      description_en: multiLang.en.description,
      price: parseFloat(formData.price),
      quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
      calories: formData.calories ? parseInt(formData.calories) : undefined
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LangTabs value={activeLang} onValueChange={setActiveLang} className="mb-4">
        <LangTabsList className="flex gap-2 justify-center">
          {LANGS.map(l => (
            <LangTabsTrigger key={l.code} value={l.code}>{l.label}</LangTabsTrigger>
          ))}
        </LangTabsList>
        {LANGS.map(l => (
          <LangTabsContent key={l.code} value={l.code}>
            {/* Asosiy ma'lumotlar formi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('admin.products.form.sections.basic')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`name_${l.code}`}>{t('admin.products.form.fields.name')}</Label>
                  <Input
                      id={`name_${l.code}`}
                      value={multiLang[l.code].name}
                      onChange={e => handleMultiLangChange(l.code, 'name', e.target.value)}
                    placeholder={t('admin.products.form.placeholders.name')}
                      required={activeLang === l.code}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`description_${l.code}`}>{t('admin.products.form.fields.shortDescription')}</Label>
                    <Textarea
                      id={`description_${l.code}`}
                      value={multiLang[l.code].description}
                      onChange={e => handleMultiLangChange(l.code, 'description', e.target.value)}
                      placeholder={t('admin.products.form.placeholders.shortDescription')}
                      rows={3}
                      required={activeLang === l.code}
                  />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">{t('admin.products.form.fields.category')}</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.products.form.placeholders.category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">{t('admin.products.form.fields.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder={t('admin.products.form.placeholders.price')}
                    min="0"
                    step="100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rating">{t('admin.products.form.fields.rating')}</Label>
                  <Input
                    id="rating"
                    type="number"
                    value={formData.rating}
                    onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
                    placeholder={t('admin.products.form.placeholders.rating')}
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">{t('admin.products.form.fields.quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder={t('admin.products.form.placeholders.quantity')}
                    min="0"
                    disabled={!formData.isAvailable}
                    className={!formData.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  />
                  {!formData.isAvailable && (
                    <p className="text-sm text-gray-500 mt-1">
                      Mahsulot mavjud emas bo'lganda miqdor avtomatik 0 ga teng bo'ladi
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                />
                <Label htmlFor="isAvailable">{t('admin.products.form.fields.isAvailable')}</Label>
              </div>

              {/* Asosiy rasm */}
              <div>
                <Label>{t('admin.products.form.fields.mainImage')}</Label>
                <div className="mt-2">
                  {formData.image ? (
                    <div className="relative inline-block">
                      <img
                        src={getImageUrl(formData.image)}
                        alt="Asosiy rasm"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2"
                        onClick={() => handleInputChange('image', '')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <Label htmlFor="main-image" className="cursor-pointer text-blue-600 hover:text-blue-700">
                        {t('admin.products.form.actions.uploadImage')}
                      </Label>
                      <input
                        id="main-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Label htmlFor="image-url">{t('admin.products.form.fields.imageUrl')}</Label>
                  <Input
                    id="image-url"
                    value={typeof formData.image === 'string' ? formData.image : ''}
                    onChange={e => handleInputChange('image', e.target.value)}
                    placeholder={t('admin.products.form.placeholders.imageUrl')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          </LangTabsContent>
        ))}
      </LangTabs>
      {/* Form actions (Saqlash, Bekor qilish) */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('admin.products.form.actions.cancel')}
        </Button>
        <Button type="submit" disabled={loading || uploading} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
          {loading ? t('admin.products.form.actions.saving') : t('admin.products.form.actions.save')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm; 