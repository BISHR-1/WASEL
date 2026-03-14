import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Loader2,
  LogOut,
  MapPin,
  Save,
  Truck,
  Package,
  Phone,
  MessageCircle,
  Camera,
  Play,
  CheckCircle,
  User,
  RefreshCcw,
  FileText,
  Link as LinkIcon,
  Copy,
  ShieldAlert,
  Clock,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { notifyOrderUsers, notifyAdminUsers } from '@/services/firebaseOrderNotifications';
import { useUsdToSypRate } from '@/lib/exchangeRate';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const STATUS_LABELS = {
  assigned: { label: 'مفرز (بانتظار القبول)', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'جاري تحميل البضاعة', color: 'bg-indigo-100 text-indigo-700' },
  in_progress: { label: 'قيد التوصيل', color: 'bg-amber-100 text-amber-700' },
  delivering: { label: 'في الطريق للمستلم', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'تم التسليم', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوض', color: 'bg-rose-100 text-rose-700' },
};

const ACTIVE_STATUSES = ['assigned', 'accepted', 'in_progress', 'delivering'];
const DEFAULT_EXCHANGE_RATE = 150;
const COMMISSION_PER_ORDER_USD = 1.5;
const BONUS_EVERY_ORDERS = 40;
const BONUS_USD = 30;
const SUPERVISOR_WHATSAPP = '963944000000';
const KYC_STORAGE_BUCKETS = ['courier-kyc-v2', 'courier-kyc'];

function parseKycStoredValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return { bucket: null, path: null, url: null };

  if (/^https?:\/\//i.test(raw)) {
    const objectMarker = '/object/';
    const markerIndex = raw.indexOf(objectMarker);
    if (markerIndex >= 0) {
      const objectPart = raw.slice(markerIndex + objectMarker.length);
      const parts = objectPart.split('/').filter(Boolean);
      const idx = parts.findIndex((part) => part === 'public' || part === 'sign' || part === 'authenticated');
      if (idx >= 0 && parts[idx + 1]) {
        const bucket = parts[idx + 1];
        const path = parts.slice(idx + 2).join('/');
        if (path) return { bucket, path, url: raw };
      }
    }
    return { bucket: null, path: null, url: raw };
  }

  const prefixedBucket = KYC_STORAGE_BUCKETS.find((bucket) => raw.startsWith(`${bucket}:`));
  if (prefixedBucket) {
    return { bucket: prefixedBucket, path: raw.slice(prefixedBucket.length + 1), url: null };
  }

  if (raw.includes('/')) {
    return { bucket: null, path: raw, url: null };
  }

  return { bucket: null, path: null, url: raw };
}

function getItemImageUrl(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.image_url === 'string' && item.image_url.trim()) return item.image_url;
  if (typeof item.image === 'string' && item.image.startsWith('http')) return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    const img = item.images[0];
    if (typeof img === 'string') return img;
    if (img && typeof img.url === 'string') return img.url;
  }
  return null;
}

function extractOrderItems(order) {
  if (Array.isArray(order.items) && order.items.length > 0) return order.items;
  const cs = order.cart_snapshot;
  if (cs && Array.isArray(cs.items) && cs.items.length > 0) return cs.items;
  const md = order.metadata;
  if (md && Array.isArray(md.items) && md.items.length > 0) return md.items;
  if (md && md.cart_snapshot && Array.isArray(md.cart_snapshot.items) && md.cart_snapshot.items.length > 0) return md.cart_snapshot.items;
  if (typeof order.items === 'string') {
    try {
      const parsed = JSON.parse(order.items);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
}

function getOrderInstructions(orderItems) {
  const lower = orderItems.map((i) => String(i?.category || i?.item_type || i?.type || '').toLowerCase());
  const names = orderItems.map((i) => i?.name || i?.product_name || i?.item_name || '').filter(Boolean).join('، ');
  const hasGiftsOrPackages = lower.some((v) => /gift|هدي|package|باقة/.test(v));
  const hasElectronics = lower.some((v) => /electronic|phone|mobile|موبايل|الكترون/.test(v));
  const onlyFast = lower.every((v) => /restaurant|مطعم|supermarket|سوبر/.test(v));

  const notes = [];
  if (hasGiftsOrPackages) notes.push('اذهب إلى المورد لاستلام طلبات الهدايا والباقات.');
  if (hasElectronics) notes.push(`اذهب إلى المورد لاستلام سعر الجهاز ومواصفاته: ${names || 'حسب الطلب'}.`);
  if (!hasGiftsOrPackages && !hasElectronics && onlyFast) notes.push('طلب مطعم/سوبرماركت ويمكن تنفيذه مباشرة دون مراجعة المورد.');
  return notes;
}

function normalizeReferralCode(userId) {
  const token = String(userId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  return token || `WASEL${Math.floor(Math.random() * 9000 + 1000)}`;
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return '';
  try {
    if (timeStr.includes('T') || timeStr.includes('-')) {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('ar-SA', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      }
    }
    return timeStr;
  } catch {
    return timeStr;
  }
}

export default function DriverPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLocation, setDriverLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('motorbike');
  const [payoutCycle, setPayoutCycle] = useState('weekly');

  const [kycFrontFile, setKycFrontFile] = useState(null);
  const [kycBackFile, setKycBackFile] = useState(null);
  const [kycFrontPreview, setKycFrontPreview] = useState('');
  const [kycBackPreview, setKycBackPreview] = useState('');
  const [kycFrontUploading, setKycFrontUploading] = useState(false);
  const [kycBackUploading, setKycBackUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const [proofFiles, setProofFiles] = useState({});
  const [proofNotes, setProofNotes] = useState({});
  const [uploadingForOrder, setUploadingForOrder] = useState(null);
  const [uploadedProofIds, setUploadedProofIds] = useState(() => new Set());

  const [activeTab, setActiveTab] = useState('active');

  // Chat with supervisor state
  const [courierChatMessages, setCourierChatMessages] = useState([]);
  const [courierChatInput, setCourierChatInput] = useState('');
  const [sendingCourierChat, setSendingCourierChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [courierProfile, setCourierProfile] = useState(null);
  const [referralStats, setReferralStats] = useState({ registered: 0, qualified: 0 });
  const [privateNotices, setPrivateNotices] = useState([]);
  const [loadingPrivateNotices, setLoadingPrivateNotices] = useState(false);
  const exchangeRate = useUsdToSypRate();

  const isOnboardingComplete = Boolean(courierProfile?.onboarding_completed);

  const getCourierAssignmentIds = useCallback((user) => {
    const ids = [
      user?.assignment_id,
      user?.auth_id,
      user?.id,
    ].filter(Boolean).map((value) => String(value));

    return Array.from(new Set(ids));
  }, []);

  const profileDraftStorageKey = useMemo(() => {
    if (!currentUser?.id) return null;
    return `wasel_driver_profile_draft:${currentUser.id}`;
  }, [currentUser?.id]);

  const resolveKycPreviewUrl = useCallback(async (storedValue) => {
    const parsed = parseKycStoredValue(storedValue);
    if (!parsed.path) return parsed.url || null;

    const buckets = parsed.bucket ? [parsed.bucket] : KYC_STORAGE_BUCKETS;
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parsed.path, 60 * 60 * 24 * 7);
        if (!error && data?.signedUrl) return data.signedUrl;
      } catch {
        // Try the next bucket candidate.
      }
    }

    return parsed.url || null;
  }, []);

  const loadPrivateSupervisorNotices = useCallback(async (publicUserId) => {
    if (!publicUserId) {
      setPrivateNotices([]);
      return;
    }
    setLoadingPrivateNotices(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, link')
        .eq('user_id', publicUserId)
        .eq('type', 'supervisor_private_message')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      setPrivateNotices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('loadPrivateSupervisorNotices warning:', error);
      setPrivateNotices([]);
    } finally {
      setLoadingPrivateNotices(false);
    }
  }, []);

  const handleKycFileChange = useCallback((side, file) => {
    if (!file) {
      if (side === 'front') {
        setKycFrontFile(null);
        setKycFrontPreview('');
      } else {
        setKycBackFile(null);
        setKycBackPreview('');
      }
      return;
    }

    if (!String(file.type || '').startsWith('image/')) {
      toast.error('يرجى اختيار صورة فقط للهوية');
      return;
    }

    if (side === 'front') {
      setKycFrontFile(file);
      setKycFrontPreview(file ? URL.createObjectURL(file) : '');
      setKycFrontUploading(true);
      (async () => {
        try {
          const uploadedValue = await uploadKycFile('front', file);
          const previewUrl = await resolveKycPreviewUrl(uploadedValue);
          setCourierProfile((prev) => ({
            ...(prev || {}),
            id_front_value: uploadedValue,
            id_front_url: previewUrl || prev?.id_front_url || null,
          }));
          setKycFrontFile(null);
          toast.success('تم حفظ صورة الهوية الأمامية');
        } catch (error) {
          console.error('Front ID upload error:', error);
          toast.error('تعذر رفع صورة الهوية الأمامية');
        } finally {
          setKycFrontUploading(false);
        }
      })();
      return;
    }
    setKycBackFile(file);
    setKycBackPreview(file ? URL.createObjectURL(file) : '');
    setKycBackUploading(true);
    (async () => {
      try {
        const uploadedValue = await uploadKycFile('back', file);
        const previewUrl = await resolveKycPreviewUrl(uploadedValue);
        setCourierProfile((prev) => ({
          ...(prev || {}),
          id_back_value: uploadedValue,
          id_back_url: previewUrl || prev?.id_back_url || null,
        }));
        setKycBackFile(null);
        toast.success('تم حفظ صورة الهوية الخلفية');
      } catch (error) {
        console.error('Back ID upload error:', error);
        toast.error('تعذر رفع صورة الهوية الخلفية');
      } finally {
        setKycBackUploading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (kycFrontPreview) URL.revokeObjectURL(kycFrontPreview);
      if (kycBackPreview) URL.revokeObjectURL(kycBackPreview);
    };
  }, [kycFrontPreview, kycBackPreview]);

  useEffect(() => {
    if (!profileDraftStorageKey) return;
    try {
      const draft = {
        driverName,
        driverPhone,
        driverLocation,
        vehicleType,
        payoutCycle,
        id_front_value: courierProfile?.id_front_value || null,
        id_back_value: courierProfile?.id_back_value || null,
      };
      localStorage.setItem(profileDraftStorageKey, JSON.stringify(draft));
    } catch {
      // ignore draft persistence failures
    }
  }, [profileDraftStorageKey, driverName, driverPhone, driverLocation, vehicleType, payoutCycle, courierProfile?.id_front_value, courierProfile?.id_back_value]);

  const loadAssignedOrders = async (user) => {
    const assignmentTargetIds = getCourierAssignmentIds(user);
    if (assignmentTargetIds.length === 0) {
      setOrders([]);
      return;
    }

    const { data: assigned, error } = await supabase
      .from('order_assignments')
      .select('*')
      .in('delivery_person_id', assignmentTargetIds)
      .in('status', ['assigned', 'accepted', 'in_progress', 'delivering', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const assignmentRows = Array.isArray(assigned) ? assigned : [];
    const orderIds = assignmentRows.map((e) => e.order_id).filter(Boolean);

    let ordersById = {};
    if (orderIds.length > 0) {
      const { data: orderRows, error: ordersError } = await supabase.from('orders').select('*').in('id', orderIds);
      if (ordersError) throw ordersError;
      ordersById = (orderRows || []).reduce((acc, row) => {
        acc[row.id] = row;
        return acc;
      }, {});

      // Fetch proofs securely
      try {
        const { data: proofsRows } = await supabase.from('delivery_proofs').select('order_id').in('order_id', orderIds);
        if (proofsRows && proofsRows.length > 0) {
           const existingProofs = new Set(proofsRows.map(p => p.order_id));
           setUploadedProofIds(prev => {
             const newSet = new Set(prev);
             existingProofs.forEach(id => newSet.add(id));
             return newSet;
           });
        }
      } catch (err) {
        console.error("Failed to load delivery proofs:", err);
      }
    }

    const list = assignmentRows.map((entry) => ({
      ...(ordersById[entry.order_id] || { id: entry.order_id, order_number: entry.order_id, recipient_details: {}, sender_details: {} }),
      assignment_id: entry.id,
      assignment_status: entry.status,
      assignment_updated_at: entry.updated_at || entry.created_at,
    }));

    const ids = list.map((o) => o.id).filter(Boolean);
    if (ids.length > 0) {
      const { data: orderItems } = await supabase.from('order_items').select('*').in('order_id', ids);
      const itemsByOrder = (orderItems || []).reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});
      list.forEach((order) => {
        if ((itemsByOrder[order.id] || []).length > 0) order.items = itemsByOrder[order.id];
      });
    }

    setOrders(list);
    if (!selectedOrderId && list.length > 0) setSelectedOrderId(list[0].id);
  };

  const loadCourierProfile = async (user) => {
    const userId = user?.id;
    if (!userId) return;

    const [courierResult, deliveryResult, userResult, referralResult] = await Promise.all([
      supabase
        .from('courier_profiles')
        .select('user_id, phone, vehicle_type, current_location, payout_cycle, id_front_url, id_back_url, onboarding_completed, first_delivery_completed_at, referral_code')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.from('delivery_profiles').select('vehicle_type, current_location').eq('user_id', userId).maybeSingle(),
      supabase.from('users').select('full_name, phone').eq('id', userId).maybeSingle(),
      supabase.from('courier_referrals').select('registration_completed, onboarding_completed').eq('referrer_user_id', userId),
    ]);

    const courierData = courierResult?.data || null;
    const deliveryData = deliveryResult?.data || null;
    const userData = userResult?.data || null;
    const idFrontStored = courierData?.id_front_url || null;
    const idBackStored = courierData?.id_back_url || null;
    const [idFrontPreviewUrl, idBackPreviewUrl] = await Promise.all([
      resolveKycPreviewUrl(idFrontStored),
      resolveKycPreviewUrl(idBackStored),
    ]);

    const nextVehicle = courierData?.vehicle_type || deliveryData?.vehicle_type || 'motorbike';
    const nextLocation = courierData?.current_location || deliveryData?.current_location || '';
    const nextPhone = courierData?.phone || userData?.phone || '';

    setVehicleType(nextVehicle);
    setDriverLocation(nextLocation);
    setDriverPhone(nextPhone);
    setPayoutCycle(courierData?.payout_cycle || 'weekly');
    if (userData?.full_name) setDriverName(userData.full_name);

    setCourierProfile({
      user_id: userId,
      phone: nextPhone,
      vehicle_type: nextVehicle,
      current_location: nextLocation,
      payout_cycle: courierData?.payout_cycle || 'weekly',
      id_front_url: idFrontPreviewUrl,
      id_back_url: idBackPreviewUrl,
      id_front_value: idFrontStored,
      id_back_value: idBackStored,
      onboarding_completed: Boolean(courierData?.onboarding_completed),
      first_delivery_completed_at: courierData?.first_delivery_completed_at || null,
      referral_code: courierData?.referral_code || normalizeReferralCode(userId),
    });

    try {
      const draftRaw = profileDraftStorageKey ? localStorage.getItem(profileDraftStorageKey) : null;
      const draft = draftRaw ? JSON.parse(draftRaw) : null;
      if (draft && typeof draft === 'object') {
        if (draft.driverName && !userData?.full_name) setDriverName(String(draft.driverName));
        if (draft.driverPhone && !nextPhone) setDriverPhone(String(draft.driverPhone));
        if (draft.driverLocation && !nextLocation) setDriverLocation(String(draft.driverLocation));
        if (draft.vehicleType && !courierData?.vehicle_type) setVehicleType(String(draft.vehicleType));
      }
    } catch {
      // ignore invalid draft format
    }

    await loadPrivateSupervisorNotices(userId);

    const refs = referralResult?.data || [];
    setReferralStats({
      registered: refs.filter((r) => r.registration_completed).length,
      qualified: refs.filter((r) => r.onboarding_completed).length,
    });
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        if (!authUser) {
          navigate(createPageUrl('StaffLogin'));
          return;
        }

        const { data: userRow, error } = await supabase
          .from('users')
          .select('id, full_name, email, role, auth_id')
          .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id},email.eq.${authUser.email}`)
          .maybeSingle();

        if (error || !userRow || !['courier', 'delivery_person'].includes(String(userRow.role || '').toLowerCase())) {
          navigate(createPageUrl('Home'));
          return;
        }

        const unified = {
          id: userRow.id,
          assignment_id: authUser.id,
          auth_id: userRow.auth_id || authUser.id,
          name: userRow.full_name || authUser.email || 'Courier',
          email: userRow.email || authUser.email,
          role: 'courier',
        };

        setCurrentUser(unified);
        setDriverName(unified.name || '');
        await Promise.all([loadAssignedOrders(unified), loadCourierProfile(unified)]);
      } catch (error) {
        console.error('Driver bootstrap error', error);
        toast.error('تعذر فتح لوحة الموصل');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  useEffect(() => {
    const assignmentTargetIds = getCourierAssignmentIds(currentUser);
    if (assignmentTargetIds.length === 0) return undefined;

    const refresh = () => loadAssignedOrders(currentUser).catch(() => {});
    const channel = supabase.channel(`driver-assignments-${assignmentTargetIds.join('-')}`);

    assignmentTargetIds.forEach((assignmentTargetId) => {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'order_assignments',
        filter: `delivery_person_id=eq.${assignmentTargetId}`,
      }, refresh);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, getCourierAssignmentIds]);

  const handleManualRefreshOrders = async () => {
    if (!currentUser) return;
    try {
      setRefreshingOrders(true);
      await Promise.all([loadAssignedOrders(currentUser)]);
      toast.success('تم تحديث الطلبات');
    } catch {
      toast.error('تعذر تحديث الطلبات');
    } finally {
      setRefreshingOrders(false);
    }
  };

  const saveDeliveryProfile = async () => {
    if (!currentUser?.id) return;
    if (!driverName.trim() || !driverLocation.trim()) {
      toast.error('يرجى إدخال الاسم والعنوان');
      return;
    }

    try {
      setSavingProfile(true);
      await supabase.from('users').update({ full_name: driverName.trim(), phone: driverPhone || null }).eq('id', currentUser.id);
      await supabase.from('delivery_profiles').upsert({
        user_id: currentUser.id,
        vehicle_type: vehicleType,
        current_location: driverLocation.trim(),
        vehicle_note: `courier_name:${driverName.trim()}`,
        is_available: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      toast.success('تم حفظ البيانات العامة');
      await loadCourierProfile(currentUser);
    } catch (error) {
      console.error(error);
      toast.error('تعذر حفظ البيانات العامة');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadKycFile = async (side, file) => {
    const safeName = String(file.name || `${side}-id`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${currentUser.id}/${side}-${Date.now()}-${safeName}`;
    let lastError = null;

    for (const bucket of KYC_STORAGE_BUCKETS) {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (!error) {
        return `${bucket}:${path}`;
      }
      lastError = error;
    }

    throw lastError || new Error('KYC upload failed');
  };

  const saveCourierOnboarding = async () => {
    if (!currentUser?.id) return;
    if (!driverName.trim() || !driverPhone.trim() || !driverLocation.trim()) {
      toast.error('أدخل الاسم والهاتف والعنوان');
      return;
    }
    if (!courierProfile?.id_front_url && !kycFrontFile) {
      toast.error('يرجى رفع صورة الهوية الأمامية');
      return;
    }
    if (!courierProfile?.id_back_url && !kycBackFile) {
      toast.error('يرجى رفع صورة الهوية الخلفية');
      return;
    }
    if (courierProfile?.onboarding_completed && courierProfile?.payout_cycle && courierProfile.payout_cycle !== payoutCycle) {
      toast.error('لا يمكن تغيير دورة الراتب بعد الاعتماد');
      return;
    }

    try {
      setSavingOnboarding(true);
      let idFrontUrl = courierProfile?.id_front_value || courierProfile?.id_front_url || null;
      let idBackUrl = courierProfile?.id_back_value || courierProfile?.id_back_url || null;
      if (kycFrontFile) idFrontUrl = await uploadKycFile('front', kycFrontFile);
      if (kycBackFile) idBackUrl = await uploadKycFile('back', kycBackFile);

      await supabase.from('courier_profiles').upsert({
        user_id: currentUser.id,
        phone: driverPhone.trim(),
        vehicle_type: vehicleType,
        current_location: driverLocation.trim(),
        payout_cycle: courierProfile?.payout_cycle || payoutCycle,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        onboarding_completed: true,
        referral_code: courierProfile?.referral_code || normalizeReferralCode(currentUser.id),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      // Note: courier_referrals is NO LONGER updated to true here.
      // It is updated to true in markDelivered once the courier completes 3 orders.

      toast.success('تم اعتماد بيانات الموصل');
      await loadCourierProfile(currentUser);
      setActiveTab('active');
    } catch (error) {
      console.error(error);
      toast.error('تعذر حفظ بيانات الموصل. تأكد من تنفيذ ملف SQL.');
    } finally {
      setSavingOnboarding(false);
    }
  };

  const updateAssignmentAndOrder = async (order, assignmentStatus, orderStatus) => {
    await supabase.from('order_assignments').update({ status: assignmentStatus }).eq('id', order.assignment_id);
    if (orderStatus) await supabase.from('orders').update({ status: orderStatus }).eq('id', order.id);
  };

  const markAccepted = async (order) => {
    // Optimistic update: show change immediately
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: 'accepted' } : o));
    try {
      const { error } = await supabase.from('order_assignments').update({ status: 'accepted' }).eq('id', order.assignment_id);
      if (error) {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: 'assigned' } : o));
        throw error;
      }
      supabase.from('orders').update({ status: 'loading_goods' }).eq('id', order.id).then(() => {});
      getOrderInstructions(extractOrderItems(order)).forEach((message) => toast.info(message, { duration: 15000 }));
      toast.success('تم قبول الطلب وبدء التحميل');
    } catch (err) {
      toast.error(`فشل قبول الطلب: ${err?.message || ''}`);
    }
  };

  const markRejected = async (order) => {
    const prevStatus = order.assignment_status;
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: 'rejected' } : o));
    try {
      const { error } = await supabase.from('order_assignments').update({ status: 'rejected' }).eq('id', order.assignment_id);
      if (error) {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: prevStatus } : o));
        throw error;
      }
      supabase.from('orders').update({ status: 'paid' }).eq('id', order.id).then(() => {});
      toast.success('تم رفض الطلب وإعادته للمشرف');
      notifyAdminUsers('order_status_changed', order, { newStatus: 'rejected_by_courier', courierName: currentUser?.name || 'الموصل' }).catch(e => console.warn('Reject notify error:', e));
    } catch (err) {
      toast.error(`فشل رفض الطلب: ${err?.message || ''}`);
    }
  };

  const markInProgress = async (order) => {
    const prevStatus = order.assignment_status;
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: 'delivering', status: 'delivering' } : o));
    try {
      const { error } = await supabase.from('order_assignments').update({ status: 'delivering' }).eq('id', order.assignment_id);
      if (error) {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: prevStatus, status: order.status } : o));
        throw error;
      }
      supabase.from('orders').update({ status: 'delivering' }).eq('id', order.id).then(() => {});
      notifyOrderUsers('order_status_changed', order, { newStatus: 'delivering' }).catch(() => {});
      toast.success('تم بدء التوصيل للمستلم');
    } catch (err) {
      toast.error(`فشل بدء التوصيل: ${err?.message || ''}`);
    }
  };

  const markDelivered = async (order) => {
    if (!uploadedProofIds.has(order.id)) {
      toast.error('يجب رفع دليل التسليم أولاً');
      return;
    }

    try {
      const { error: assignErr } = await supabase.from('order_assignments').update({ status: 'completed' }).eq('id', order.assignment_id);
      if (assignErr) throw assignErr;

      const { error: orderErr } = await supabase.from('orders').update({ status: 'completed', shipping_status: 'delivered' }).eq('id', order.id);
      if (orderErr) console.warn('orders update warning (RLS may restrict):', orderErr.message);

      // Optimistic update: move order to archived immediately
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, assignment_status: 'completed', status: 'completed' } : o));

      // Background tasks (non-blocking)
      if (!courierProfile?.first_delivery_completed_at) {
        supabase.from('courier_profiles').update({ first_delivery_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', currentUser.id).then(() => {});
      }
      // Increment completed orders count and add delivery fee to balance
      supabase.rpc('increment_courier_stats', { p_user_id: currentUser.id, p_delivery_fee_usd: Number(order.delivery_fee || 1) }).then(({ error: incErr }) => {
        if (incErr) {
          // Fallback: direct increment if RPC doesn't exist
          supabase.from('courier_profiles')
            .update({
              completed_orders_count: (courierProfile?.completed_orders_count || 0) + 1,
              balance_usd: (courierProfile?.balance_usd || 0) + Number(order.delivery_fee || 1),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', currentUser.id)
            .then(() => {});
        }
      });
      supabase.from('order_assignments')
        .select('*', { count: 'exact', head: true })
        .in('delivery_person_id', getCourierAssignmentIds(currentUser))
        .eq('status', 'completed')
        .then(({ count }) => {
          if ((count || 0) >= 3) {
            supabase.from('courier_referrals')
              .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
              .eq('referred_user_id', currentUser.id)
              .eq('registration_completed', true)
              .then(() => {});
          }
        });

      notifyOrderUsers('order_delivered', order).catch(() => {});
      toast.success('تم التسليم بنجاح 🎉');
      loadCourierProfile(currentUser).catch(() => {});
    } catch (err) {
      console.error('markDelivered error:', err);
      toast.error(`فشل إنهاء التسليم: ${err?.message || 'خطأ غير معروف'}`);
    }
  };

  const uploadDeliveryProof = async (order) => {
    const file = proofFiles[order.id];
    if (!file) {
      toast.error('اختر صورة أو فيديو أولاً');
      return;
    }

    try {
      setUploadingForOrder(order.id);
      const safeName = String(file.name || 'proof').replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${order.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('delivery-proofs').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('delivery-proofs').getPublicUrl(storagePath);
      const publicUrl = publicData?.publicUrl || null;
      const proofType = file.type.startsWith('video/') ? 'video' : 'photo';

      const { error: insertError } = await supabase.from('delivery_proofs').insert({
        order_id: order.id,
        uploaded_by: currentUser?.id || null,
        uploader_role: 'courier',
        proof_type: proofType,
        file_path: storagePath,
        public_url: publicUrl,
        notes: proofNotes[order.id] || null,
        is_visible_to_customer: true,
        metadata: {
          uploaded_from: 'driver_panel',
          mime_type: file.type || null,
          size: file.size || null,
        },
      });
      if (insertError) throw insertError;

      await notifyOrderUsers('delivery_proof_uploaded', order, { proofType });
      setUploadedProofIds((prev) => {
        const next = new Set(prev);
        next.add(order.id);
        return next;
      });
      setProofFiles((prev) => ({ ...prev, [order.id]: null }));
      setProofNotes((prev) => ({ ...prev, [order.id]: '' }));
      toast.success('تم رفع دليل التسليم');
    } catch (error) {
      console.error(error);
      toast.error('فشل رفع دليل التسليم');
    } finally {
      setUploadingForOrder(null);
    }
  };

  // ---- Courier-Supervisor Chat ----
  const courierConversationId = courierProfile?.user_id
    ? `courier_supervisor:${courierProfile.user_id}`
    : null;

  const loadCourierChat = async () => {
    if (!courierConversationId) return;
    setChatLoading(true);
    try {
      // Ensure conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', courierConversationId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('conversations').insert([{
          id: courierConversationId,
          type: 'courier_supervisor',
          participant_ids: [courierProfile.user_id],
          status: 'active',
        }]);
      }

      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', courierConversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      setCourierChatMessages(msgs || []);
    } catch (err) {
      console.error('Load courier chat error:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const sendCourierChatMessage = async () => {
    if (!courierChatInput.trim() || !courierConversationId) return;
    setSendingCourierChat(true);
    try {
      const messageText = courierChatInput.trim();
      setCourierChatInput('');
      const msg = {
        conversation_id: courierConversationId,
        sender_id: courierProfile.user_id,
        sender_name: driverName || 'موصل',
        sender_role: 'courier',
        message: messageText,
      };
      await supabase.from('direct_messages').insert([msg]);
      await supabase.from('conversations').update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      }).eq('id', courierConversationId);

      // Notify supervisor
      try {
        await notifyAdminUsers('new_chat_message', { id: courierConversationId }, { senderName: msg.sender_name });
      } catch (e) { /* silent */ }
    } catch (err) {
      console.error('Send courier chat error:', err);
      toast.error('فشل إرسال الرسالة');
    } finally {
      setSendingCourierChat(false);
    }
  };

  // Real-time subscription for courier chat
  useEffect(() => {
    if (!courierConversationId || activeTab !== 'chat') return;
    loadCourierChat();
    const channel = supabase.channel(`courier-chat-${courierConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${courierConversationId}`,
      }, (payload) => {
        setCourierChatMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [courierConversationId, activeTab]);

  const openWhatsAppRecipient = (order) => {
    const phone = String(order?.recipient_details?.phone || '').replace(/[^0-9+]/g, '');
    if (!phone || phone.length < 6) {
      toast.error('رقم هاتف المستلم غير صالح');
      return;
    }

    const waPhone = phone.startsWith('+') ? phone.slice(1) : phone;
    const recipientName = order?.recipient_details?.name || 'العميل';
    const orderLabel = order?.order_number || order?.id;
    const message = [
      `مرحباً ${recipientName} 👋`,
      `أنا ${driverName || 'موصل واصل ستور'}، مع طلبك رقم ${orderLabel}.`,
      'أرجو تأكيد عنوان التسليم.',
    ].join('\n');

    window.open(`https://wa.me/${encodeURIComponent(waPhone)}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(createPageUrl('StaffLogin'));
  };

  const activeOrders = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(String(o.assignment_status || '').toLowerCase())), [orders]);
  const archivedOrders = useMemo(() => orders.filter((o) => !ACTIVE_STATUSES.includes(String(o.assignment_status || '').toLowerCase())), [orders]);
  const focusedOrder = activeOrders.find((o) => o.id === selectedOrderId) || activeOrders[0] || null;

  const completedOrders = useMemo(() => orders.filter((o) => String(o.assignment_status || '').toLowerCase() === 'completed'), [orders]);
  const completedCount = completedOrders.length;
  const bonusBlocks = Math.floor(completedCount / BONUS_EVERY_ORDERS);
  const commissionUsd = completedCount * COMMISSION_PER_ORDER_USD;
  const referralBonusUsd = (referralStats.qualified || 0) * 3; // $3 per qualified referral (who completed 3 orders)
  const bonusUsd = (bonusBlocks * BONUS_USD) + referralBonusUsd;
  const totalBalanceUsd = commissionUsd + bonusUsd;
  const avgRate = completedOrders.length > 0 ? Math.round(completedOrders.reduce((acc, o) => acc + (Number(o.exchange_rate) || DEFAULT_EXCHANGE_RATE), 0) / completedOrders.length) : DEFAULT_EXCHANGE_RATE;
  const effectiveExchangeRate = Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : avgRate;
  const totalBalanceSyp = totalBalanceUsd * effectiveExchangeRate;

  const progressInBlock = completedCount % BONUS_EVERY_ORDERS;
  const progressPercent = (progressInBlock / BONUS_EVERY_ORDERS) * 100;

  const firstCompletedAt = useMemo(() => {
    if (courierProfile?.first_delivery_completed_at) return new Date(courierProfile.first_delivery_completed_at);
    if (completedOrders.length === 0) return null;
    const minTime = completedOrders.reduce((minVal, item) => {
      const currentVal = new Date(item.assignment_updated_at || item.updated_at || item.created_at || Date.now()).getTime();
      return Math.min(minVal, currentVal);
    }, Date.now());
    return new Date(minTime);
  }, [completedOrders, courierProfile?.first_delivery_completed_at]);

  const cycleDays = (courierProfile?.payout_cycle || payoutCycle) === 'monthly' ? 30 : 7;
  const nextPayoutAt = firstCompletedAt ? new Date(firstCompletedAt.getTime() + cycleDays * 24 * 60 * 60 * 1000) : null;
  const canRequestPayout = Boolean(nextPayoutAt && Date.now() >= nextPayoutAt.getTime());

  useEffect(() => {
    const sendPayrollReadyNotification = async () => {
      if (!currentUser?.id || !canRequestPayout || !nextPayoutAt) return;
      const cycleName = (courierProfile?.payout_cycle || payoutCycle) === 'monthly' ? 'شهري' : 'أسبوعي';
      const key = `wasel_payroll_ready_${currentUser.id}_${cycleName}_${nextPayoutAt.toISOString().slice(0, 10)}`;
      if (localStorage.getItem(key)) return;

      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            userIds: [String(currentUser.assignment_id || currentUser.id)],
            title: '💰 يمكنك استلام راتبك الآن',
            body: `أصبح راتبك ${cycleName} جاهزًا. افتح صفحة الرصيد لإرسال الطلب.`,
            data: { type: 'payroll_ready', cycle: cycleName, target: 'balance' },
          },
        });
        localStorage.setItem(key, '1');
      } catch {
        // ignore notification failures
      }
    };

    sendPayrollReadyNotification();
  }, [canRequestPayout, courierProfile?.payout_cycle, currentUser?.assignment_id, currentUser?.id, nextPayoutAt, payoutCycle]);

  const handlePayoutRequest = async () => {
    if (!canRequestPayout || !nextPayoutAt) return;
    try {
      setSendingPayoutRequest(true);
      const cycleLabel = (courierProfile?.payout_cycle || payoutCycle) === 'monthly' ? 'شهري' : 'أسبوعي';
      const startedAt = firstCompletedAt ? firstCompletedAt.toLocaleDateString('ar-EG') : '-';
      const untilAt = new Date().toLocaleDateString('ar-EG');
      const message = [
        'مرحباً مشرف واصل ستور،',
        `أنا الموصل: ${driverName || currentUser?.name || '-'}`,
        `أطلب استلام راتبي ${cycleLabel}.`,
        `عدد الطلبات المكتملة: ${completedCount}`,
        `الرصيد بالدولار: ${totalBalanceUsd.toFixed(2)}$`,
        `الرصيد بالليرة: ${Math.round(totalBalanceSyp).toLocaleString('en-US')} ل.س`,
        `فترة الاستحقاق: من ${startedAt} حتى ${untilAt}`,
        `رقم هاتفي: ${driverPhone || '-'}`,
      ].join('\n');

      const waUrl = `https://wa.me/${encodeURIComponent(SUPERVISOR_WHATSAPP)}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      toast.success('تم تجهيز رسالة طلب استلام الراتب');
    } finally {
      setSendingPayoutRequest(false);
    }
  };

  const referralLink = `${window.location.origin}${createPageUrl('Login')}?join=courier&ref=${encodeURIComponent(courierProfile?.referral_code || normalizeReferralCode(currentUser?.id))}`;
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('تم نسخ رابط الإحالة');
    } catch {
      toast.error('تعذر نسخ الرابط');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF9] flex-col gap-4">
        <SmartLottie
          animationPath={ANIMATION_PRESETS.pageLoading.path}
          width={80}
          height={80}
          trigger="never"
          autoplay={true}
          loop={true}
        />
        <p className="text-[#475569] font-['Cairo'] font-bold">جاري تجهيز لوحة الموصل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAF9] font-['Cairo']" dir="rtl">
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-l from-[#1B4332] via-[#2D6A4F] to-[#40916C] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner"><Truck className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">لوحة الموصل</h1>
              <p className="text-xs text-white/70">مرحباً {currentUser?.name || 'بالموصل'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleManualRefreshOrders} disabled={refreshingOrders} className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl text-xs">
              {refreshingOrders ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 ml-1" />} تحديث
            </Button>
            <Button variant="outline" onClick={handleLogout} className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl text-xs"><LogOut className="w-4 h-4 ml-1" /> خروج</Button>
          </div>
        </div>
        {isOnboardingComplete && (
          <div className="max-w-6xl mx-auto px-4 pb-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              <div className="flex-1 min-w-[90px] rounded-xl bg-white/15 backdrop-blur-sm p-3 text-center">
                <p className="text-2xl font-black text-white">{activeOrders.length}</p>
                <p className="text-[10px] text-white/80">طلبات نشطة</p>
              </div>
              <div className="flex-1 min-w-[90px] rounded-xl bg-white/15 backdrop-blur-sm p-3 text-center">
                <p className="text-2xl font-black text-white">{completedCount}</p>
                <p className="text-[10px] text-white/80">مكتملة</p>
              </div>
              <div className="flex-1 min-w-[90px] rounded-xl bg-white/15 backdrop-blur-sm p-3 text-center">
                <p className="text-2xl font-black text-[#6EE7B7]">{totalBalanceUsd.toFixed(1)}$</p>
                <p className="text-[10px] text-white/80">الرصيد</p>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`max-w-6xl mx-auto px-4 pb-6 space-y-6 ${isOnboardingComplete ? 'pt-40' : 'pt-24'}`}>
        {isOnboardingComplete && activeTab !== 'profile' && (
  <div className="flex gap-2 flex-wrap mb-4 bg-white rounded-2xl p-1.5 shadow-sm border border-[#E5E7EB]">
    <button onClick={() => setActiveTab('active')} className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-[#1B4332] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>طلبات حالية ({activeOrders.length})</button>
    <button onClick={() => setActiveTab('archive')} className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-bold transition-all ${activeTab === 'archive' ? 'bg-[#1B4332] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>سجل الطلبات ({archivedOrders.length})</button>
    <button onClick={() => setActiveTab('chat')} className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-[#2563EB] text-white shadow-md' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>💬 المحادثة</button>
    <button onClick={() => setActiveTab('profile')} className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 bg-orange-50 hover:bg-orange-100'}`}>الملف الشخصي</button>
  </div>
)}
        

                {/* Chat with Supervisor Tab */}
                {isOnboardingComplete && activeTab === 'chat' && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-[#E7ECEA] bg-white shadow-sm overflow-hidden" style={{ minHeight: '50vh' }}>
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-[#E7ECEA] bg-[#F8FAFB]">
                      <MessageCircle className="w-5 h-5 text-[#2563EB]" />
                      <h3 className="font-black text-[#1B4332] text-lg">المحادثة مع المشرف</h3>
                    </div>

                    {chatLoading ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1B4332]" /></div>
                    ) : (
                      <div className="flex flex-col" style={{ height: '50vh' }}>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {courierChatMessages.length === 0 ? (
                            <div className="text-center text-sm text-[#94A3B8] mt-8">
                              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                              <p>لا توجد رسائل بعد</p>
                              <p className="text-xs mt-1">أرسل رسالة للتواصل مع المشرف</p>
                            </div>
                          ) : courierChatMessages.map((msg, idx) => {
                            const isMine = msg.sender_role === 'courier' || msg.sender_id === courierProfile?.user_id;
                            return (
                              <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                  isMine
                                    ? 'bg-[#1B4332] text-white rounded-br-sm'
                                    : 'bg-[#E7ECEA] text-[#1B4332] rounded-bl-sm'
                                }`}>
                                  {!isMine && (
                                    <p className="text-[10px] font-bold mb-0.5 opacity-70">{msg.sender_name || 'المشرف'}</p>
                                  )}
                                  <p className="text-sm leading-relaxed">{msg.message}</p>
                                  {msg.attachment_url && (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block opacity-80">📎 مرفق</a>
                                  )}
                                  <p className={`text-[10px] mt-1 ${isMine ? 'text-green-200' : 'text-gray-400'}`}>
                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#E7ECEA] bg-[#F8FAFB]">
                          <input
                            type="text"
                            value={courierChatInput}
                            onChange={(e) => setCourierChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendCourierChatMessage()}
                            placeholder="اكتب رسالة للمشرف..."
                            className="flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm focus:border-[#1B4332] focus:outline-none"
                            dir="rtl"
                          />
                          <Button
                            onClick={sendCourierChatMessage}
                            disabled={!courierChatInput.trim() || sendingCourierChat}
                            className="rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white h-10 w-10 p-0"
                          >
                            {sendingCourierChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.section>
                )}

                {( !isOnboardingComplete || activeTab === 'profile' ) && (
<motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#E7ECEA] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-[#1B4332]" /><h3 className="font-black text-[#1B4332] text-lg">بيانات الموصل</h3></div>
          <div className="grid md:grid-cols-3 gap-3">
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="اسم الموصل" className="rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm" />
            <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="رقم الهاتف" className="rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm" />
            <input value={driverLocation} onChange={(e) => setDriverLocation(e.target.value)} placeholder="العنوان / المنطقة" className="rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm" />
            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="rounded-xl border border-[#E5E7EB] bg-[#FAFCFB] p-3 text-sm">
              <option value="motorbike">ماتور</option><option value="car">سيارة</option><option value="bicycle">دراجة</option><option value="other">أخرى</option>
            </select>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-sm text-[#475569]">الراتب يُدار تلقائيًا من الإدارة (بدون اختيار)</div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <label className="rounded-xl border border-dashed border-[#9CA3AF] p-3 bg-[#FAFCFB] text-sm">
              <span className="font-bold text-[#1F2933]">صورة الهوية (الأمام)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleKycFileChange('front', e.target.files?.[0] || null)}
                className="block mt-2 w-full text-xs"
              />
              {kycFrontUploading && <p className="mt-2 text-xs font-bold text-blue-700">جارٍ رفع الصورة...</p>}
              {kycFrontPreview && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 block mb-1">معاينة قبل الحفظ:</span>
                  <img src={kycFrontPreview} alt="ID Front Preview" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB] bg-white" />
                </div>
              )}
              {courierProfile?.id_front_url && !kycFrontPreview && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 block mb-1">صورة الهوية (الأمام) الحالية:</span>
                  <img src={courierProfile.id_front_url} alt="ID Front" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" />
                </div>
              )}
              <p className="mt-2 text-xs font-bold text-[#64748B]">يمكنك رفع أي صورة مناسبة للهوية.</p>
            </label>

            <label className="rounded-xl border border-dashed border-[#9CA3AF] p-3 bg-[#FAFCFB] text-sm">
              <span className="font-bold text-[#1F2933]">صورة الهوية (الخلف)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleKycFileChange('back', e.target.files?.[0] || null)}
                className="block mt-2 w-full text-xs"
              />
              {kycBackUploading && <p className="mt-2 text-xs font-bold text-blue-700">جارٍ رفع الصورة...</p>}
              {kycBackPreview && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 block mb-1">معاينة قبل الحفظ:</span>
                  <img src={kycBackPreview} alt="ID Back Preview" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB] bg-white" />
                </div>
              )}
              {courierProfile?.id_back_url && !kycBackPreview && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500 block mb-1">صورة الهوية (الخلف) الحالية:</span>
                  <img src={courierProfile.id_back_url} alt="ID Back" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" />
                </div>
              )}
              <p className="mt-2 text-xs font-bold text-[#64748B]">يمكنك رفع أي صورة مناسبة للهوية.</p>
            </label>
          </div>

          <div className="mt-3 text-xs text-[#64748B] flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> يجب إكمال الهوية والهاتف واختيار دورة الراتب قبل ظهور الطلبات.</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveDeliveryProfile} disabled={savingProfile} className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl px-6">{savingProfile ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Save className="w-4 h-4 ml-1" />}حفظ البيانات العامة</Button>
            <Button onClick={saveCourierOnboarding} disabled={savingOnboarding || kycFrontUploading || kycBackUploading} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl px-6">{savingOnboarding ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <FileText className="w-4 h-4 ml-1" />}{isOnboardingComplete ? 'تحديث معلومات الإلزام' : 'اعتماد بيانات الموصل'}</Button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-3">
            <p className="text-sm font-black text-[#1E3A8A] mb-2">رسائل المشرف الخاصة</p>
            {loadingPrivateNotices ? (
              <p className="text-xs text-[#475569]">جاري تحميل الرسائل...</p>
            ) : privateNotices.length === 0 ? (
              <p className="text-xs text-[#64748B]">لا توجد رسائل خاصة حتى الآن.</p>
            ) : (
              <div className="space-y-2">
                {privateNotices.map((notice) => (
                  <div key={notice.id} className="rounded-xl border border-[#BFDBFE] bg-white p-2">
                    <p className="text-xs font-bold text-[#1E40AF]">{notice.title || 'رسالة من المشرف'}</p>
                    <p className="text-xs text-[#334155] mt-1 whitespace-pre-line">{notice.message || ''}</p>
                    <p className="text-[10px] text-[#64748B] mt-1">{notice.created_at ? new Date(notice.created_at).toLocaleString('ar-SY') : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-3 text-sm">
            <a href={createPageUrl('CourierTerms')} className="text-[#0F766E] underline">شروط وأحكام الموصل</a>
            <a href={createPageUrl('CourierGuide')} className="text-[#1B4332] underline font-bold">📖 دليل الموصل</a>
          </div>
        </motion.section>
        )}

        {!isOnboardingComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border-2 border-dashed border-[#D1D5DB] bg-white p-10 text-center">
            <Package className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-[#64748B] font-bold">أكمل معلومات الموصل أولًا ليتم فتح قائمة الطلبات</p>
          </motion.div>
        )}

        {isOnboardingComplete && activeTab !== 'profile' && (
          <>
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3"><h3 className="font-black text-[#0F172A] text-lg">🏆 شريط المكافأة</h3><Badge className="bg-[#DCFCE7] text-[#166534] border-0 text-xs">كل {BONUS_EVERY_ORDERS} طلب = +{BONUS_USD}$</Badge></div>
              <div className="h-4 rounded-full bg-[#E5E7EB] overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-[#10B981] via-[#059669] to-[#047857] rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} /></div>
              <p className="text-xs text-[#475569] mt-2 font-medium">{progressInBlock} / {BONUS_EVERY_ORDERS} طلب</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-4 border border-[#BBF7D0]"><p className="text-[11px] text-[#166534] font-medium">عمولة الطلب</p><p className="font-black text-[#166534] text-xl mt-1">{COMMISSION_PER_ORDER_USD.toFixed(2)}$</p><p className="text-[10px] text-[#15803D] mt-2 leading-tight">{completedCount} طلب = {commissionUsd.toFixed(2)}$</p></div>
                <div className="rounded-2xl bg-gradient-to-br from-[#FEF9C3] to-[#FEF08A] p-4 border border-[#FDE047]"><p className="text-[11px] text-[#854D0E] font-medium">المكافآت</p><p className="font-black text-[#854D0E] text-xl mt-1">{bonusUsd.toFixed(2)}$</p><p className="text-[10px] text-[#A16207] mt-2 leading-tight">مكافأة إنجاز</p></div>
                <div className="rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#A7F3D0] p-4 border border-[#6EE7B7] relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-[#059669]" /><p className="text-[11px] text-[#065F46] font-medium">الرصيد الكلي</p><p className="font-black text-[#065F46] text-xl mt-1">{totalBalanceUsd.toFixed(2)}$</p><p className="text-[10px] text-[#047857] mt-2 leading-tight">{Math.round(totalBalanceSyp).toLocaleString('en-US')} ل.س</p></div>
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-2 text-center">سعر الصرف: {Math.round(effectiveExchangeRate).toLocaleString('en-US')} ل.س/$</p>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap"><div><h3 className="font-black text-[#0F172A] text-lg">🤝 برنامج الإحالة</h3><p className="text-xs text-[#64748B] mt-1">3$ لكل صديق يكمل 3 طلبات توصيل ناجحة</p></div><Button onClick={copyReferralLink} variant="outline" className="rounded-xl border-[#0F766E] text-[#0F766E] hover:bg-[#F0FDFA]"><Copy className="w-4 h-4 ml-1" />نسخ الرابط</Button></div>
              <div className="mt-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] p-3 text-sm text-[#115E59] flex items-start gap-2" dir="ltr"><LinkIcon className="w-4 h-4 mt-0.5 shrink-0" /><span className="break-all text-xs">{referralLink}</span></div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] p-4 border border-[#93C5FD] text-center"><p className="text-3xl font-black text-[#1E40AF]">{referralStats.registered}</p><p className="text-[11px] text-[#3B82F6] font-medium mt-1">مسجلون</p></div>
                <div className="rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-4 border border-[#86EFAC] text-center"><p className="text-3xl font-black text-[#166534]">{referralStats.qualified}</p><p className="text-[11px] text-[#15803D] font-medium mt-1">مؤهلون ({referralBonusUsd}$)</p></div>
              </div>
            </motion.section>

            {activeTab === 'active' && (
              <>
                {activeOrders.length === 0 && <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-[#64748B]">لا يوجد طلبات نشطة حاليًا</div>}
                {focusedOrder && (
                  <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border-2 border-[#BFDBFE] bg-white shadow-sm overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-[#EFF6FF] to-white">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#1E3A8A] text-xl">طلب #{focusedOrder.order_number || String(focusedOrder.id).slice(0, 8)}</h3><p className="text-sm text-[#475569] mt-1">بطاقة الطلب الحالية. الأزرار تظهر تدريجيًا حسب الحالة.</p></div><Badge className={`${(STATUS_LABELS[focusedOrder.assignment_status] || STATUS_LABELS.assigned).color} border-0`}>{(STATUS_LABELS[focusedOrder.assignment_status] || STATUS_LABELS.assigned).label}</Badge></div>
                      <div className="mt-3 space-y-1 text-sm text-[#334155]"><p className="flex items-center gap-1"><User className="w-4 h-4" /> {focusedOrder.recipient_details?.name || '-'}</p><p className="flex items-center gap-1"><Phone className="w-4 h-4" /> {focusedOrder.recipient_details?.phone || '-'}</p><p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {focusedOrder.recipient_details?.address || '-'}</p>
{(() => {
  const userTime = focusedOrder.recipient_details?.delivery_time;
  const supervisorTime = focusedOrder.delivery_time || `${focusedOrder.preferred_delivery_date || ''} ${focusedOrder.preferred_delivery_time || ''}`.trim();
  const timeToShow = userTime || supervisorTime;
  if (!timeToShow) return null;
  return (
    <p className="flex items-center gap-1 mt-2 text-[#92400E] bg-[#FEF3C7] p-2 rounded-lg text-xs font-bold border border-[#FDE68A]">
      <Clock className="w-4 h-4" />
      {userTime ? `المطلوب: ${formatDisplayTime(userTime)}` : `المتوقع من المشرف: ${formatDisplayTime(supervisorTime)}`}
    </p>
  );
})()}
</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {String(focusedOrder.assignment_status) === 'assigned' && (
                          <>
                            <Button onClick={() => markAccepted(focusedOrder)} className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white">قبول الطلب</Button>
                            <Button onClick={() => markRejected(focusedOrder)} variant="outline" className="rounded-xl border-[#DC2626] text-[#DC2626]">رفض الطلب</Button>
                          </>
                        )}
                        {(String(focusedOrder.assignment_status) === 'accepted' || String(focusedOrder.assignment_status) === 'loading_goods') && (
                          <Button onClick={() => markInProgress(focusedOrder)} className="rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white"><Play className="w-4 h-4 ml-1" />جاري التوصيل</Button>
                        )}
                        {(String(focusedOrder.assignment_status) === 'delivering' || String(focusedOrder.assignment_status) === 'in_progress') && (
                          <>
                            <Button size="sm" onClick={() => openWhatsAppRecipient(focusedOrder)} className="rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white"><MessageCircle className="w-4 h-4 ml-1" />واتساب المستلم</Button>
                            <Button onClick={() => markDelivered(focusedOrder)} className="rounded-xl bg-[#059669] hover:bg-[#047857] text-white"><CheckCircle className="w-4 h-4 ml-1" />تم التسليم</Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-5 border-t border-[#E7ECEA]">
                      <p className="text-sm font-black text-[#1B4332] mb-3 flex items-center gap-1"><Package className="w-4 h-4" />محتويات الطلب ({extractOrderItems(focusedOrder).length} صنف)</p>
                      
                      {/* Gift indicator if order contains gifts */}
                      {extractOrderItems(focusedOrder).some(i => /gift|هدي|باقة|package/i.test(String(i?.category || i?.item_type || ''))) && (
                        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold flex items-center gap-2">
                          🎁 هذا الطلب يحتوي على هدايا - يرجى التعامل بعناية
                        </div>
                      )}
                      
                      {/* Cash gift message if present */}
                      {(focusedOrder.cash_gift_amount || focusedOrder.gift_message) && (
                        <div className="mb-3 p-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-800 text-sm">
                          <p className="font-bold flex items-center gap-2">💝 هدية نقدية مرفقة</p>
                          {focusedOrder.cash_gift_amount > 0 && <p className="mt-1">المبلغ: <span className="font-bold">${focusedOrder.cash_gift_amount}</span></p>}
                          {focusedOrder.gift_message && <p className="mt-1 italic">"{focusedOrder.gift_message}"</p>}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {extractOrderItems(focusedOrder).map((item, idx) => {
                          const imageUrl = getItemImageUrl(item);
                          const name = item.product_name || item.item_name || item.name_ar || item.name || `صنف ${idx + 1}`;
                          const qty = Number(item.quantity || item.qty || 1);
                          const isGift = /gift|هدي/i.test(String(item?.category || item?.item_type || ''));
                          return (
                            <div key={`${focusedOrder.id}-item-${idx}`} className={`flex items-center gap-3 rounded-xl border ${isGift ? 'border-amber-300 bg-amber-50' : 'border-[#E7ECEA] bg-[#FAFCFB]'} p-3`}>
                              {imageUrl ? <img src={imageUrl} alt={name} className="h-14 w-14 rounded-lg object-cover border border-[#E5E7EB] shrink-0" /> : <div className="h-14 w-14 rounded-lg bg-[#F1F5F9] border border-[#E5E7EB] flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-[#94A3B8]" /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1B4332] truncate">{isGift ? '🎁 ' : ''}{name}</p>
                                <p className="text-xs text-[#64748B]">الكمية: {qty}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {(String(focusedOrder.assignment_status) === 'delivering' || String(focusedOrder.assignment_status) === 'completed') && (
                        <div className="mt-4 rounded-xl border border-[#E7ECEA] bg-[#FAFCFB] p-4">
                          <p className="text-sm font-bold text-[#1B4332] mb-3 flex items-center gap-1"><Camera className="w-4 h-4" />إثبات التسليم</p>
                          <input type="file" accept="image/*,video/*" onChange={(e) => setProofFiles((prev) => ({ ...prev, [focusedOrder.id]: e.target.files?.[0] || null }))} className="block w-full text-sm mb-2 file:rounded-lg file:border-0 file:bg-[#1B4332] file:text-white file:px-3 file:py-1.5 file:text-sm file:cursor-pointer" />
                          <textarea value={proofNotes[focusedOrder.id] || ''} onChange={(e) => setProofNotes((prev) => ({ ...prev, [focusedOrder.id]: e.target.value }))} placeholder="ملاحظات إضافية (اختياري)" rows={2} className="w-full border border-[#E5E7EB] rounded-xl p-3 text-sm mb-2 bg-white" />
                          <Button onClick={() => uploadDeliveryProof(focusedOrder)} disabled={uploadingForOrder === focusedOrder.id} className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-xl">{uploadingForOrder === focusedOrder.id ? <><Loader2 className="w-4 h-4 animate-spin ml-1" />جارٍ الرفع...</> : <><Camera className="w-4 h-4 ml-1" />رفع دليل التسليم</>}</Button>
                        </div>
                      )}
                    </div>
                  </motion.article>
                )}

                {activeOrders.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#475569]">طلبات نشطة أخرى</p>
                    {activeOrders.filter((o) => o.id !== focusedOrder?.id).map((order) => (
                      <button key={order.id} type="button" onClick={() => setSelectedOrderId(order.id)} className="w-full text-right rounded-xl border border-[#E2E8F0] bg-white p-3 hover:border-[#93C5FD] transition">
                        <div className="flex items-center justify-between"><div><p className="font-bold text-[#1F2937]">طلب #{order.order_number || String(order.id).slice(0, 8)}</p><p className="text-xs text-[#64748B]">{order.recipient_details?.name || '-'} - {order.recipient_details?.phone || '-'}</p></div>
{(() => {
  const userTime = order.recipient_details?.delivery_time;
  const supervisorTime = order.delivery_time || `${order.preferred_delivery_date || ''} ${order.preferred_delivery_time || ''}`.trim();
  const timeToShow = userTime || supervisorTime;
  if (!timeToShow) return null;
  return (
    <div className="flex items-center gap-1 mt-2 text-[#92400E] bg-[#FEF3C7] p-2 rounded-lg text-[10px] font-bold border border-[#FDE68A] w-max">
      <Clock className="w-3 h-3" />
      {userTime ? `المطلوب: ${formatDisplayTime(userTime)}` : `المتوقع من المشرف: ${formatDisplayTime(supervisorTime)}`}
    </div>
  );
})()}
<Badge className={`${(STATUS_LABELS[order.assignment_status] || STATUS_LABELS.assigned).color} border-0`}>{(STATUS_LABELS[order.assignment_status] || STATUS_LABELS.assigned).label}</Badge></div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'archive' && (
              <div className="space-y-3">
                {archivedOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-[#64748B]">لا يوجد سجل محفوظ حتى الآن</div> : archivedOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.assignment_status] || STATUS_LABELS.completed;
                  return (
                    <div key={order.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-4"><div className="flex items-center justify-between"><div><p className="font-bold text-[#0F172A]">طلب #{order.order_number || String(order.id).slice(0, 8)}</p><p className="text-xs text-[#64748B]">{order.recipient_details?.name || '-'} - {order.recipient_details?.phone || '-'}</p></div>
{(() => {
  const userTime = order.recipient_details?.delivery_time;
  const supervisorTime = order.delivery_time || `${order.preferred_delivery_date || ''} ${order.preferred_delivery_time || ''}`.trim();
  const timeToShow = userTime || supervisorTime;
  if (!timeToShow) return null;
  return (
    <div className="flex items-center gap-1 mt-2 text-[#92400E] bg-[#FEF3C7] p-2 rounded-lg text-[10px] font-bold border border-[#FDE68A] w-max">
      <Clock className="w-3 h-3" />
      {userTime ? `المطلوب: ${formatDisplayTime(userTime)}` : `المتوقع من المشرف: ${formatDisplayTime(supervisorTime)}`}
    </div>
  );
})()}
<Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge></div></div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
