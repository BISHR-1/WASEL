import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Navigation, Check, ChevronRight, Edit3, MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load Leaflet to avoid SSR issues
const LazyMap = React.lazy(() =>
  Promise.all([
    import('leaflet'),
    import('react-leaflet'),
    import('leaflet/dist/leaflet.css'),
  ]).then(([L, RL]) => {
    // Fix default marker icon
    delete L.default.Icon.Default.prototype._getIconUrl;
    L.default.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Component that renders the map
    function MapInner({ position, onPositionChange }) {
      const map = RL.useMap();

      useEffect(() => {
        if (position) {
          map.setView(position, map.getZoom());
        }
      }, [position, map]);

      const MapEvents = () => {
        RL.useMapEvents({
          click(e) {
            onPositionChange([e.latlng.lat, e.latlng.lng]);
          },
        });
        return null;
      };

      return (
        <>
          <MapEvents />
          <RL.TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <RL.Marker position={position} />}
        </>
      );
    }

    // Wrapper that creates the MapContainer
    function MapWrapper({ position, onPositionChange, center }) {
      return (
        <RL.MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <MapInner position={position} onPositionChange={onPositionChange} />
        </RL.MapContainer>
      );
    }

    return { default: MapWrapper };
  })
);

// Default center: Daraa, Syria
const DARAA_CENTER = [32.6189, 36.1021];

export default function MapAddressPicker({
  recipientAddress,
  setRecipientAddress,
  disabled = false,
}) {
  const [step, setStep] = useState('idle'); // idle | map | details | review
  const [mapPosition, setMapPosition] = useState(null);
  const [addressDetails, setAddressDetails] = useState(recipientAddress || '');
  const [isLocating, setIsLocating] = useState(false);

  // Sync external changes
  useEffect(() => {
    setAddressDetails(recipientAddress || '');
  }, [recipientAddress]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapPosition([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setMapPosition(DARAA_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleConfirm = useCallback(() => {
    const parts = [];
    if (addressDetails.trim()) parts.push(addressDetails.trim());
    if (mapPosition) parts.push(`📍 ${mapPosition[0].toFixed(6)}, ${mapPosition[1].toFixed(6)}`);
    setRecipientAddress(parts.join('\n'));
    setStep('idle');
  }, [addressDetails, mapPosition, setRecipientAddress]);

  const hasLocation = !!mapPosition;
  const hasDetails = !!addressDetails.trim();
  const mapCenter = mapPosition || DARAA_CENTER;

  if (disabled) return null;

  return (
    <div className="space-y-3" dir="rtl">
      {/* Current address display when idle */}
      {step === 'idle' && (
        <div className="space-y-2">
          {/* Map pick button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('map')}
            className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-colors text-right"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-900">
                {hasLocation ? 'تم تحديد الموقع ✓' : 'اختر موقعك على الخريطة'}
              </p>
              <p className="text-xs text-emerald-700 truncate">
                {hasLocation
                  ? `الإحداثيات: ${mapPosition[0].toFixed(4)}, ${mapPosition[1].toFixed(4)}`
                  : 'اضغط لتحديد موقع التوصيل التقريبي'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0 rotate-180" />
          </motion.button>

          {/* Address details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">أضف التفاصيل الدقيقة *</label>
            <textarea
              rows="3"
              value={addressDetails}
              onChange={(e) => {
                setAddressDetails(e.target.value);
                // Also update parent immediately for text-only typing
                const parts = [];
                if (e.target.value.trim()) parts.push(e.target.value.trim());
                if (mapPosition) parts.push(`📍 ${mapPosition[0].toFixed(6)}, ${mapPosition[1].toFixed(6)}`);
                setRecipientAddress(parts.join('\n'));
              }}
              placeholder="بيت رقم 12، بجانب جامع الأمل، حي السلام"
              className="w-full border bg-gray-50 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none transition-all"
            />
          </div>

          {/* Review button - show only when both are filled */}
          {(hasLocation || hasDetails) && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('review')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              مراجعة العنوان والتأكيد
            </motion.button>
          )}
        </div>
      )}

      {/* Step 1: Map picker fullscreen overlay */}
      <AnimatePresence>
        {step === 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
              <button
                type="button"
                onClick={() => setStep('idle')}
                className="text-sm font-bold px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                ← رجوع
              </button>
              <h3 className="font-bold text-base">حدد موقع التوصيل</h3>
              <div className="w-16" />
            </div>

            {/* Instructions */}
            <div className="bg-emerald-50 px-4 py-2 text-center border-b border-emerald-200">
              <p className="text-sm text-emerald-800 font-medium">اضغط على الخريطة لتحديد موقع التوصيل التقريبي</p>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-600">جاري تحميل الخريطة...</p>
                  </div>
                </div>
              }>
                <LazyMap
                  position={mapPosition}
                  onPositionChange={setMapPosition}
                  center={mapCenter}
                />
              </React.Suspense>

              {/* Locate me button */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="absolute bottom-24 left-4 z-[400] bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors border border-gray-200"
              >
                {isLocating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="w-5 h-5 text-emerald-600" />
                )}
              </button>
            </div>

            {/* Bottom action */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
              {mapPosition && (
                <p className="text-xs text-gray-500 text-center mb-2">
                  📍 {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                </p>
              )}
              <button
                type="button"
                onClick={() => setStep('idle')}
                disabled={!mapPosition}
                className={`w-full py-3 rounded-xl font-bold text-base transition-colors ${
                  mapPosition
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {mapPosition ? 'تأكيد الموقع' : 'حدد موقعاً على الخريطة'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review overlay */}
      <AnimatePresence>
        {step === 'review' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setStep('idle')}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-emerald-600 text-white px-5 py-4">
                <h3 className="font-bold text-lg text-center">مراجعة العنوان</h3>
                <p className="text-emerald-100 text-xs text-center mt-1">تأكد من صحة العنوان قبل إرسال الطلب</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Mini map preview */}
                {hasLocation && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 h-40">
                    <React.Suspense fallback={
                      <div className="h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-xs text-gray-400">تحميل...</p>
                      </div>
                    }>
                      <LazyMap
                        position={mapPosition}
                        onPositionChange={() => {}}
                        center={mapPosition}
                      />
                    </React.Suspense>
                  </div>
                )}

                {/* Location coordinates */}
                {hasLocation && (
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-800 font-medium">
                      📍 {mapPosition[0].toFixed(5)}, {mapPosition[1].toFixed(5)}
                    </span>
                  </div>
                )}

                {/* Text details */}
                {hasDetails && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">التفاصيل:</p>
                    <p className="text-sm text-gray-800 font-semibold leading-relaxed">{addressDetails}</p>
                  </div>
                )}

                {!hasLocation && !hasDetails && (
                  <p className="text-center text-gray-400 text-sm py-4">لم يتم تحديد أي عنوان بعد</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  تأكيد العنوان
                </button>
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  تعديل
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
