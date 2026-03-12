import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SmartLottie from '@/components/animations/SmartLottie';
import { ANIMATION_PRESETS } from '@/components/animations/animationPresets';

const STEPS = [
	{ id: 'pending', label: 'تم الاستلام', icon: Package, description: 'طلبك وصل وسيتم مراجعته' },
	{ id: 'processing', label: 'قيد التجهيز', icon: Clock, description: 'جاري تحضير الطلب' },
	{ id: 'delivering', label: 'جاري التوصيل', icon: Truck, description: 'مندوبنا في الطريق إليك' },
	{ id: 'completed', label: 'تم التسليم', icon: CheckCircle, description: 'وصل الطلب بنجاح' },
];

function getCurrentStepIndex(status) {
	const map = { pending: 0, processing: 1, delivering: 2, completed: 3, cancelled: -1 };
	return map[status] ?? 0;
}

function isUuid(value) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

export default function TrackOrder() {
	const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search || '') : new URLSearchParams();
	const prefilled = String(urlParams.get('order') || '').trim();

	const [orderId, setOrderId] = useState(prefilled);
	const [searchTrigger, setSearchTrigger] = useState(prefilled);

	const { data: order, isLoading, error } = useQuery({
		queryKey: ['track-order', searchTrigger],
		queryFn: async () => {
			if (!searchTrigger) return null;

			const token = String(searchTrigger).trim();
			const tokenUpper = token.toUpperCase();
			const tokenLower = token.toLowerCase();
			const filters = [
				`order_number.eq.${token}`,
				`order_number.eq.${tokenUpper}`,
				`order_number.eq.${tokenLower}`,
			];

			if (isUuid(token)) {
				filters.push(`id.eq.${token}`);
			}

			const { data, error } = await supabase
				.from('orders')
				.select('*')
				.or(filters.join(','))
				.limit(1)
				.maybeSingle();

			if (error) throw error;
			if (!data) throw new Error('Order not found');

			const { data: proofData } = await supabase
				.from('delivery_proofs')
				.select('*')
				.eq('order_id', data.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			
			if (proofData) {
				data.delivery_proof = proofData;
			}

			return data;
		},
		enabled: !!searchTrigger,
		retry: false,
	});

	const handleSearch = (event) => {
		event.preventDefault();
		setSearchTrigger(orderId.trim());
	};

	const normalizedStatus = order?.status || (order?.payment_status === 'succeeded' ? 'completed' : 'pending');
	const isCancelled = normalizedStatus === 'cancelled';
	const currentStep = order ? getCurrentStepIndex(normalizedStatus) : 0;
	const totalDisplay = order
		? (Number(order.total_amount ?? (order.total_cents ? Number(order.total_cents) / 100 : 0)).toFixed(2))
		: '0.00';
	const currencyDisplay = order?.currency || 'USD';

	return (
		<div className="min-h-screen bg-[#FDFBF7] pb-20">
			<div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] pt-28 pb-14 px-4 rounded-b-[36px] shadow-lg mb-8">
				<div className="max-w-2xl mx-auto text-center space-y-5">
					<motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white">
						تتبع طلبك
					</motion.h1>

					<motion.form
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						onSubmit={handleSearch}
						className="relative max-w-lg mx-auto"
					>
						<Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<Input
							value={orderId}
							onChange={(event) => setOrderId(event.target.value)}
							placeholder="اكتب رقم الطلب الحقيقي (مثال: WSL-12345678)"
							className="h-14 pr-12 rounded-2xl border-none shadow-xl text-base bg-white/95 focus:bg-white transition-all text-right"
						/>
						<Button type="submit" className="absolute left-2 top-2 h-10 px-6 rounded-xl bg-[#1B4332] text-white hover:bg-[#122e22]">
							تتبع
						</Button>
					</motion.form>
				</div>
			</div>

			<div className="max-w-2xl mx-auto px-4">
				{isLoading && (
					<div className="text-center py-20">
						<div className="w-12 h-12 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-gray-500">جاري البحث...</p>
					</div>
				)}

				{error && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
						<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
						<h3 className="text-xl font-bold text-[#1B4332] mb-2">الطلب غير موجود</h3>
						<p className="text-gray-500">تأكد من رقم الطلب الحقيقي وحاول مرة أخرى</p>
					</motion.div>
				)}

				{order && (
					<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#1B4332]/5">
						<div className="bg-[#1B4332]/5 p-6 border-b border-[#1B4332]/10 flex justify-between items-start gap-4">
							<div>
								<p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
								<p className="font-mono font-bold text-[#1B4332] text-sm break-all">{order.order_number || order.id}</p>
							</div>
							<div className="text-left">
								<p className="text-sm text-gray-500 mb-1">الإجمالي</p>
								<p className="font-bold text-[#1B4332]">{totalDisplay} {currencyDisplay}</p>
							</div>
						</div>

						<div className="p-8">
							{isCancelled ? (
								<div className="text-center py-8">
									<AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
									<h3 className="text-xl font-bold text-red-600">طلب ملغى</h3>
								</div>
							) : (
								<div>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
										{STEPS.map((step, index) => {
											const active = index <= currentStep;
											return (
												<div key={step.id} className={`rounded-xl border p-3 text-center ${active ? 'border-[#1B4332] bg-[#ECFDF5]' : 'border-gray-200 bg-white'}`}>
													<step.icon className={`w-5 h-5 mx-auto mb-2 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} />
													<p className={`text-xs font-bold ${active ? 'text-[#1B4332]' : 'text-gray-500'}`}>{step.label}</p>
												</div>
											);
										})}
									</div>

{/* Status Box with Animation */}
											<div className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 text-center border-2 border-blue-200 relative overflow-hidden">
												{currentStep < 3 ? (
													<>
														<h4 className="font-bold text-[#1B4332] text-lg mb-2">{STEPS[currentStep]?.label}</h4>
														<p className="text-gray-500">{STEPS[currentStep]?.description}</p>
													</>
												) : (
													<div className="space-y-3">
														<motion.div
															initial={{ scale: 0 }}
															animate={{ scale: 1 }}
															transition={{ type: 'spring', delay: 0.2 }}
														>
															<CheckCircle className="w-16 h-16 text-[#059669] mx-auto" />
														</motion.div>
														<h4 className="font-bold text-[#059669] text-xl">تم استلام طلبك بنجاح ✨</h4>
														<p className="text-gray-600 text-sm">شكراً لاختيارك خدماتنا، نتمنى أن تستمتع بالطلب</p>
														<motion.div
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															transition={{ delay: 0.5 }}
															className="text-xs text-gray-500 mt-2"
														>
															❤️ في خدمتكم دائماً
														</motion.div>
													</div>
												)}
									</div>

									{order.delivery_proof?.public_url && (
										<div className="mt-6 bg-white border border-[#E5E7EB] rounded-2xl p-6">
											<h4 className="font-bold text-[#1B4332] text-lg mb-4 flex items-center gap-2">
												<CheckCircle className="w-5 h-5 text-[#059669]" />
												إثبات التسليم
											</h4>
											{order.delivery_proof.proof_type === 'video' ? (
												<video controls className="w-full rounded-xl" src={order.delivery_proof.public_url} />
											) : (
												<img alt="إثبات التسليم" className="w-full rounded-xl object-contain" src={order.delivery_proof.public_url} />
											)}
											{order.delivery_proof.notes && (
												<p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
													{order.delivery_proof.notes}
												</p>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
