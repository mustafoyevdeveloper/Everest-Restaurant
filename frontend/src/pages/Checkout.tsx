import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useShopping } from '@/context/ShoppingContext';
import { useAuth } from '@/context/AuthContext';
import { useCreateOrder } from '@/hooks/useOrder';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader, Truck, Store } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PaymePayment from '@/components/Payment/PaymePayment';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api';

const popularCountries = ['Uzbekistan'];

const uzRegions = [
    'Toshkent', 'Andijon', 'Buxoro', 'Fargʻona', 'Jizzax', 'Namangan', 'Navoiy', 'Qashqadaryo', 'Qoraqalpogʻiston', 'Samarqand', 'Sirdaryo', 'Surxondaryo', 'Toshkent viloyati', 'Xorazm'
];
  
const uzDistricts: { [key: string]: string[] } = {
    'Toshkent': ['Yunusobod', 'Chilonzor', 'Yakkasaroy', 'Olmazor', 'Mirobod', 'Uchtepa', 'Shayxontohur', 'Sergeli', 'Bektemir', 'Yashnobod', 'Mirzo Ulugʻbek'],
    'Yunusobod': ['Minor', 'Bodomzor', 'Xasanboy', 'Turkiston'],
    'Chilonzor': ['Chilonzor-1', 'Qatortol', 'Novza', 'Lutfiy'],
    'Andijon': ['Andijon shahri', 'Asaka', 'Baliqchi', 'Boʻston', 'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', 'Oltinkoʻl', 'Paxtaobod', 'Qoʻrgʻontepa', 'Shahrixon', 'Ulugʻnor', 'Xoʻjaobod'],
    'Buxoro': ['Buxoro shahri', 'Gʻijduvon', 'Jondor', 'Kogon', 'Olot', 'Peshku', 'Qorakoʻl', 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent'],
    'Fargʻona': ['Fargʻona shahri', 'Bagʻdod', 'Beshariq', 'Buvayda', 'Dangʻara', 'Fargʻona', 'Furqat', 'Qoʻqon', 'Quva', 'Rishton', 'Soʻx', 'Toshloq', 'Uchkoʻprik', 'Oltiariq', 'Yozyovon'],
    'Jizzax': ['Jizzax shahri', 'Arnasoy', 'Baxmal', 'Doʻstlik', 'Forish', 'Gʻallaorol', 'Mirzachoʻl', 'Paxtakor', 'Yangiobod', 'Zarbdor', 'Zafarobod', 'Zomin', 'Sharof Rashidov'],
    'Namangan': ['Namangan shahri', 'Chortoq', 'Chust', 'Kosonsoy', 'Mingbuloq', 'Namangan', 'Norin', 'Pop', 'Toʻraqoʻrgʻon', 'Uchqoʻrgʻon', 'Uychi', 'Yangiqoʻrgʻon'],
    'Navoiy': ['Navoiy shahri', 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi', 'Zarafshon'],
    'Qashqadaryo': ['Qarshi shahri', 'Chiroqchi', 'Dehqonobod', 'Gʻuzor', 'Kasbi', 'Kitob', 'Koson', 'Mirishkor', 'Muborak', 'Nishon', 'Qamashi', 'Qarshi', 'Shahrisabz', 'Yakkabogʻ'],
    'Qoraqalpogʻiston': ['Nukus shahri', 'Amudaryo', 'Beruniy', 'Chimboy', 'Ellikqalʼa', 'Kegeyli', 'Moʻynoq', 'Nukus', 'Qanlikoʻl', 'Qoʻngʻirot', 'Qoraoʻzak', 'Shumanay', 'Taxtakoʻpir', 'Toʻrtkoʻl', 'Xoʻjayli'],
    'Samarqand': ['Samarqand shahri', 'Bulungʻur', 'Ishtixon', 'Jomboy', 'Kattaqoʻrgʻon', 'Narpay', 'Nurobod', 'Oqdaryo', 'Paxtachi', 'Payariq', 'Pastdargʻom', 'Qoʻshrabot', 'Samarqand', 'Toyloq', 'Urgut'],
    'Sirdaryo': ['Guliston shahri', 'Akaltyn', 'Bayaut', 'Boyovut', 'Guliston', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Shirin', 'Sirdaryo', 'Xovos', 'Yangiyer'],
    'Surxondaryo': ['Termiz shahri', 'Angor', 'Bandixon', 'Boysun', 'Denov', 'Jarqoʻrgʻon', 'Muzrabot', 'Oltinsoy', 'Qiziriq', 'Qumqoʻrgʻon', 'Sariosiyo', 'Sherobod', 'Shoʻrchi', 'Termiz', 'Uzun'],
    'Toshkent viloyati': ['Nurafshon shahri', 'Angren', 'Bekabad', 'Boʻka', 'Boʻstonliq', 'Chinoz', 'Ohangaron', 'Olmaliq', 'Oqqoʻrgʻon', 'Parkent', 'Piskent', 'Quyichirchiq', 'Yangiyoʻl', 'Yuqorichirchiq', 'Zangiota'],
    'Xorazm': ['Urganch shahri', 'Bogʻot', 'Gurlan', 'Hazorasp', 'Khiva', 'Qoʻshkoʻpir', 'Shovot', 'Urganch', 'Xonqa', 'Yangibozor', 'Yangiariq']
};

const Checkout = () => {
    const { t, i18n } = useTranslation();
    const { cartItems, cartTotal, clearCart } = useShopping();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createOrder, isLoading, error } = useCreateOrder();

    // State declarations
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
    const [userReservations, setUserReservations] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [pickupDetails, setPickupDetails] = useState({
        specialInstructions: ''
    });

    const [shippingAddress, setShippingAddress] = useState({
        postalCode: '',
        country: 'Uzbekistan',
        region: '',
        district: '',
    });

    // Ensure cartItems is always an array
    const safeCartItems = cartItems || [];
    const safeCartTotal = cartTotal || 0;

    // Calculate delivery fee and total
    const deliveryFee = orderType === 'delivery' ? Math.round(safeCartTotal * 0.07) : 0;
    const finalTotal = safeCartTotal + deliveryFee;

    // Redirect to cart if empty
    useEffect(() => {
        if (safeCartItems.length === 0) {
            navigate('/cart');
        }
    }, [safeCartItems.length, navigate]);

    // Show loading if cart is not loaded yet
    if (!cartItems) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
                <Navbar />
                <div className="flex flex-1 flex-col items-center justify-center" style={{ marginTop: '150px' }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Load user reservations for pickup option
    useEffect(() => {
        if (user && orderType === 'pickup') {
            loadUserReservations();
        }
    }, [user, orderType]);

    const loadUserReservations = async () => {
        try {
            const response = await apiFetch('/reservations/myreservations');
            setUserReservations(response);
        } catch (error) {
            console.error('Failed to load reservations:', error);
        }
    };

    const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: 'region' | 'district', value: string) => {
        if (name === 'region') {
            setShippingAddress(prev => ({ ...prev, region: value, district: '' }));
        } else {
            setShippingAddress(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: t('checkout_login_required_title'),
                description: t('checkout_login_required_desc'),
                variant: 'destructive',
            });
            navigate('/login');
            return;
        }

        // Validate pickup order requirements
        if (orderType === 'pickup' && !selectedReservation) {
            toast({
                title: t('checkout_pickup_error_title'),
                description: t('checkout_pickup_error_desc'),
                variant: 'destructive',
            });
            return;
        }

        const orderData = {
            orderItems: safeCartItems.map(item => ({
                _id: item._id,
                nameKey: item.nameKey,
                name: getProductName(item),
                quantity: item.quantity,
                image: item.image,
                price: item.price,
            })),
            shippingAddress,
            itemsPrice: safeCartTotal,
            taxPrice: 0, // Simplified for now
            shippingPrice: deliveryFee, // Use calculated delivery fee
            totalPrice: finalTotal, // Use calculated final total
            paymentMethod: 'Payme',
            orderType,
            pickupDetails: orderType === 'pickup' ? {
                reservationId: selectedReservation?._id,
                tableNumber: selectedReservation?.tableNumber,
                specialInstructions: pickupDetails.specialInstructions
            } : undefined
        };
        
        try {
            const newOrder = await createOrder(orderData);
            toast({
                title: t('checkout_success_title'),
                description: t('checkout_success_desc', { orderId: newOrder._id }),
            });
            clearCart();
            navigate(`/my-bookings`);
        } catch (err: any) {
            toast({
                title: t('checkout_error_title'),
                description: err.message || t('checkout_error_desc'),
                variant: 'destructive',
            });
        }
    };

    const getProductName = (item: any) => {
        // Ensure we have a name field
        const name = item.name || item.name_uz || item.name_ru || item.name_en || 'Mahsulot';
        
        switch (i18n.language) {
            case 'ru':
                return item.name_ru || item.name_uz || item.name_en || name;
            case 'en':
                return item.name_en || item.name_uz || item.name_ru || name;
            default:
                return item.name_uz || item.name_ru || item.name_en || name;
        }
    };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-24 md:pt-32 pb-8 md:pb-12">
            <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-slate-800 dark:gradient-text mb-6 md:mb-8 text-center">
                    {t('checkout_title')}
                </h1>

                <div className="space-y-4 md:space-y-8">
                    {/* Order Summary Section */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                                    📋
                                </div>
                                {t('checkout_summary_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4">
                            {safeCartItems.length > 0 ? safeCartItems.map(item => (
                                <div key={item._id} className="flex justify-between items-center p-2 md:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.nameKey ? t(item.nameKey) : (item.name_uz || item.name_ru || item.name_en || 'Mahsulot')} 
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base ${item.image ? 'hidden' : ''}`}>
                                            {item.nameKey ? (t(item.nameKey) || '').charAt(0) : (item.name_uz || item.name_ru || item.name_en || item.name || '').charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-sm md:text-base truncate">
                                                {getProductName(item)}
                                            </p>
                                            <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">
                                                {t('checkout_quantity_label')}: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-blue-600 dark:text-blue-400 text-sm md:text-base">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                        <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">
                                            {formatCurrency(item.price)} {t('checkout_per_item')}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">
                                    {t('checkout_empty_cart')}
                                </div>
                            )}
                            <div className="border-t-2 border-slate-200 dark:border-slate-600 my-4 md:my-6"></div>
                            
                            {/* Price Breakdown */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm md:text-base text-slate-600 dark:text-gray-400">{t('checkout_items_total', 'Mahsulotlar narxi')}</span>
                                    <span className="text-sm md:text-base font-medium">{formatCurrency(safeCartTotal)}</span>
                                </div>
                                
                                {orderType === 'delivery' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm md:text-base text-slate-600 dark:text-gray-400">{t('checkout_delivery_fee', 'Yetkazib berish to\'lovi')} (+7%)</span>
                                        <span className="text-sm md:text-base font-medium text-green-600">{formatCurrency(deliveryFee)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="border-t-2 border-slate-200 dark:border-slate-600 my-4 md:my-6"></div>
                            <div className="flex justify-between items-center p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                                <span className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{t('checkout_total_label')}</span>
                                <span className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(finalTotal)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Type Selection Section */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                                    🚚
                                </div>
                                {t('checkout_order_type_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as 'delivery' | 'pickup')} className="space-y-4">
                                <div 
                                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                    onClick={() => setOrderType('delivery')}
                                >
                                    <RadioGroupItem value="delivery" id="delivery" />
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <Truck className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="delivery" className="text-base font-semibold cursor-pointer">
                                                {t('checkout_order_type_delivery')}
                                            </Label>
                                            <p className="text-sm text-slate-600 dark:text-gray-400">
                                                {t('checkout_order_type_delivery_desc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div 
                                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                    onClick={() => setOrderType('pickup')}
                                >
                                    <RadioGroupItem value="pickup" id="pickup" />
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                                            <Store className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="pickup" className="text-base font-semibold cursor-pointer">
                                                {t('checkout_order_type_pickup')}
                                            </Label>
                                            <p className="text-sm text-slate-600 dark:text-gray-400">
                                                {t('checkout_order_type_pickup_desc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </RadioGroup>

                            {/* Pickup Details Section */}
                            {orderType === 'pickup' && (
                                <div className="mt-6 space-y-4">
                                    <div>
                                        <Label className="text-base font-semibold">{t('checkout_pickup_reservation_title')}</Label>
                                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-3">
                                            {t('checkout_pickup_reservation_desc')}
                                        </p>
                                        
                                        {userReservations.length === 0 ? (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    {t('checkout_pickup_no_reservation')}
                                                </p>
                                            </div>
                                        ) : (
                                            <Select value={selectedReservation?._id || ''} onValueChange={(value) => {
                                                const reservation = userReservations.find(r => r._id === value);
                                                setSelectedReservation(reservation);
                                            }}>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder={t('checkout_pickup_select_reservation')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {userReservations.map((reservation) => (
                                                        <SelectItem key={reservation._id} value={reservation._id}>
                                                            {reservation.name} - {new Date(reservation.date).toLocaleDateString()} {reservation.time} - {t('checkout_pickup_table_number')}: {reservation.tableNumber}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="specialInstructions" className="text-sm">{t('checkout_pickup_special_instructions')}</Label>
                                        <Input
                                            id="specialInstructions"
                                            value={pickupDetails.specialInstructions}
                                            onChange={(e) => setPickupDetails(prev => ({ ...prev, specialInstructions: e.target.value }))}
                                            placeholder="Masalan: Issiq holda berish, qo'shimcha sous..."
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Details Section */}
                    {orderType === 'delivery' && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                                    📦
                                </div>
                                {t('checkout_shipping_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <Label htmlFor="country" className="text-sm md:text-base">{t('checkout_country_label')}</Label>
                                        <Select value={shippingAddress.country} onValueChange={(value) => handleSelectChange('region', value)}>
                                            <SelectTrigger className="h-10 md:h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {popularCountries.map(country => (
                                                    <SelectItem key={country} value={country}>
                                                        {country}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="postalCode" className="text-sm md:text-base">{t('checkout_postal_code_label')}</Label>
                                        <Input
                                            id="postalCode"
                                            name="postalCode"
                                            value={shippingAddress.postalCode}
                                            onChange={handleShippingChange}
                                            placeholder={t('checkout_postal_code_placeholder')}
                                            required
                                            className="h-10 md:h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <Label htmlFor="region" className="text-sm md:text-base">{t('checkout_region_label')}</Label>
                                        <Select value={shippingAddress.region} onValueChange={(value) => handleSelectChange('region', value)}>
                                            <SelectTrigger className="h-10 md:h-11">
                                                <SelectValue placeholder={t('checkout_region_placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {uzRegions.map(region => (
                                                    <SelectItem key={region} value={region}>
                                                        {region}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="district" className="text-sm md:text-base">{t('checkout_district_label')}</Label>
                                        <Select value={shippingAddress.district} onValueChange={(value) => handleSelectChange('district', value)} disabled={!shippingAddress.region}>
                                            <SelectTrigger className="h-10 md:h-11">
                                                <SelectValue placeholder={t('checkout_district_placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shippingAddress.region && uzDistricts[shippingAddress.region]?.map(district => (
                                                    <SelectItem key={district} value={district}>
                                                        {district}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                    )}

                                {/* Payment Method Section */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 md:pb-6">
                            <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                                        <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base">
                                            💳
                                        </div>
                                        {t('checkout_payment_title')}
                                    </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymePayment
                                amount={finalTotal}
                                onSuccess={async (cardData) => {
                                    try {
                                        // Validate required fields
                                        if (orderType === 'delivery') {
                                            if (!shippingAddress.postalCode || !shippingAddress.region || !shippingAddress.district) {
                                                throw new Error('Iltimos, barcha yetkazib berish ma\'lumotlarini to\'ldiring');
                                            }
                                        }
                                        
                                        // Create order first
                                        const orderData = {
                                            orderItems: safeCartItems.map(item => ({
                                                _id: item._id,
                                                nameKey: item.nameKey,
                                                name: getProductName(item),
                                                quantity: item.quantity,
                                                image: item.image,
                                                price: item.price,
                                            })),
                                            shippingAddress: orderType === 'delivery' ? shippingAddress : undefined,
                                            itemsPrice: safeCartTotal,
                                            taxPrice: 0,
                                            shippingPrice: deliveryFee,
                                            totalPrice: finalTotal,
                                            paymentMethod: 'Card',
                                            orderType,
                                            pickupDetails: orderType === 'pickup' ? {
                                                reservationId: selectedReservation?._id,
                                                tableNumber: selectedReservation?.tableNumber,
                                                specialInstructions: pickupDetails.specialInstructions
                                            } : undefined
                                        };
                                        
                                        const newOrder = await createOrder(orderData);
                                        
                                        // Now process the test payment with the real order ID and card data
                                        const paymentResponse = await fetch('/api/payments/test/card/order', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                                            },
                                            body: JSON.stringify({
                                                orderId: newOrder._id,
                                                cardData: cardData
                                            })
                                        });
                                        
                                        if (paymentResponse.ok) {
                                            toast({
                                                title: t('checkout_success_title'),
                                                description: t('checkout_success_desc', { orderId: newOrder._id }),
                                            });
                                            clearCart();
                                            navigate(`/my-bookings`);
                                        } else {
                                            const errorData = await paymentResponse.json();
                                            throw new Error(errorData.message || 'Payment failed');
                                        }
                                    } catch (err: any) {
                                        toast({
                                            title: t('checkout_error_title'),
                                            description: err.message || t('checkout_error_desc'),
                                            variant: 'destructive',
                                        });
                                    }
                                }}
                                onError={(error) => {
                                    console.error('Payment error:', error);
                                    toast({
                                        title: t('payment_error'),
                                        description: error.message || t('payment_failed'),
                                        variant: 'destructive'
                                    });
                                }}
                                forceCardOnly={true}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        <Footer />
    </div>
  );
};

export default Checkout;
