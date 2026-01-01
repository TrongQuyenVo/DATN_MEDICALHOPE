/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { patientsAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface Props {
  appointment: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (id: string) => Promise<void> | void;
  onCancel?: (id: string) => Promise<void> | void;
  onComplete?: (id: string, examStartTime: string, examEndTime: string) => Promise<void> | void;
}

function calculateAge(dob?: string | Date | null) {
  if (!dob) return null;
  const b = new Date(dob);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function getAppointmentTypeText(type?: string) {
  switch (type) {
    case 'consultation':
      return 'Khám lần đầu';
    case 'follow_up':
      return 'Tái khám';
    case 'emergency':
      return 'Khám khẩn cấp';
    case 'telehealth':
      return 'Khám online';
    default:
      return (type || '').replace('_', ' ');
  }
}

function getStatusText(status?: string) {
  switch (status) {
    case 'confirmed':
      return 'Đã xác nhận';
    case 'scheduled':
      return 'Đã đặt';
    case 'pending':
      return 'Chờ xác nhận';
    case 'in_progress':
      return 'Đang khám';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    case 'no_show':
      return 'Không đến';
    default:
      return status || '';
  }
}

function getGenderText(g?: string | null | undefined) {
  if (!g) return 'N/A';
  const v = String(g).toLowerCase();
  if (v === 'male' || v === 'nam') return 'Nam';
  if (v === 'female' || v === 'nữ' || v === 'nu') return 'Nữ';
  if (v === 'other' || v === 'khác') return 'Khác';
  return g;
}

export default function AppointmentDetailDialog({ appointment, open, onOpenChange, onConfirm, onCancel, onComplete }: Props) {
  const [patientFull, setPatientFull] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const isPatient = user?.role === 'patient';

  useEffect(() => {
    // Fetch enriched patient data (profile, allergies, blood type...) if needed
    const loadPatient = async () => {
      if (!appointment?.patientId) return;
      try {
        setLoading(true);
        const patient = appointment.patientId;
        const id = patient._id || patient;
        const res = await patientsAPI.getAll({ _id: id, limit: 1 });
        const p = res.data.patients?.[0] || null;
        setPatientFull(p);
      } catch (err) {
        console.error('Lỗi tải thông tin bệnh nhân:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open && appointment) loadPatient();
  }, [appointment, open]);

  // Hooks that control the completion form must be declared unconditionally
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [examStart, setExamStart] = useState<string>('');
  const [examEnd, setExamEnd] = useState<string>('');

  useEffect(() => {
    // When appointment or dialog open state changes, compute sensible defaults and close the form
    const sched = appointment?.scheduledTime ? new Date(appointment.scheduledTime) : null;
    const defaultStart = sched ? sched.toTimeString().slice(0, 5) : '09:00';
    const defaultEnd = sched ? ((): string => { const d = new Date(sched); d.setHours(d.getHours() + 1); return d.toTimeString().slice(0, 5); })() : '10:00';

    setExamStart(defaultStart);
    setExamEnd(defaultEnd);
    setShowCompleteForm(false);
  }, [appointment, open]);

  if (!appointment) return null;

  const patient = appointment.patientId;
  const patientUser = patient?.userId || {};
  const patientName = patientUser?.fullName || patient?.fullName || 'Bệnh nhân';
  const avatar = patientUser?.avatar || '';
  const email = patientUser?.email || patient?.email || '';
  const phone = patientUser?.phone || patient?.phone || '';

  const scheduled = appointment.scheduledTime ? new Date(appointment.scheduledTime) : null;

  // Completion allowed only at or after scheduled time
  const now = new Date();
  const canComplete = scheduled ? now.getTime() >= scheduled.getTime() : true;

  const profile = patientFull?.userId?.profile || patientUser?.profile || {};
  const age = calculateAge(profile?.dateOfBirth) || null;

  // Normalized scheduled date string for building ISO times
  const scheduledDateStr = scheduled ? scheduled.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md height-[90vh] sm:height-[80vh] overflow-auto ">
        <DialogHeader>
          <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            {avatar ? <AvatarImage src={avatar} alt={patientName} /> : <AvatarFallback>{patientName.charAt(0)}</AvatarFallback>}
          </Avatar>
          <div>
            <div className="font-semibold text-lg">{patientName} {patientFull?.isVerified && <Badge className="ml-2">Xác minh</Badge>}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
            <div className="text-sm text-muted-foreground">{phone}</div>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-muted-foreground text-sm">Tuổi</div>
            <div className="font-medium">{age ?? 'N/A'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Giới tính</div>
            <div className="font-medium">{getGenderText(profile?.gender)}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Địa chỉ</div>
            <div className="font-medium">{profile?.address || 'Chưa cung cấp'}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Nhóm máu</div>
            <div className="font-medium">{patientFull?.bloodType || 'N/A'}</div>
          </div>

          <div className="col-span-2">
            <div className="text-muted-foreground text-sm">Dị ứng</div>
            <div className="font-medium">{(patientFull?.allergies || []).length ? (patientFull.allergies.join(', ')) : 'Không có'}</div>
          </div>

          {patientFull?.emergencyContact && (
            <div className="col-span-2">
              <div className="text-muted-foreground text-sm">Liên hệ khẩn cấp</div>
              <div className="font-medium">{patientFull.emergencyContact}</div>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        <div className="space-y-3">
          <div>
            <div className="text-muted-foreground text-sm">Thời gian</div>
            <div className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {scheduled ? new Intl.DateTimeFormat('vi-VN', {
                weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }).format(scheduled) : 'Chưa xác định'}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Loại lịch hẹn</div>
            <div className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {getAppointmentTypeText(appointment.appointmentType)}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Trạng thái</div>
            <div className="mt-1">{appointment.status ? <Badge className="capitalize">{getStatusText(appointment.status)}</Badge> : '-'}</div>
          </div>

          {appointment.examStartTime && appointment.examEndTime && (
            <div>
              <div className="text-muted-foreground text-sm">Thời gian khám thực tế</div>
              <div className="font-medium">
                {format(new Date(appointment.examStartTime), 'HH:mm')} - {format(new Date(appointment.examEndTime), 'HH:mm')}
                {(() => {
                  const s = new Date(appointment.examStartTime);
                  const e = new Date(appointment.examEndTime);
                  const mins = Math.round((e.getTime() - s.getTime()) / (1000 * 60));
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return ` — ${h}h ${m}m`;
                })()}
              </div>
            </div>
          )}

          {appointment.patientNotes && (
            <div>
              <div className="text-muted-foreground text-sm">Ghi chú bệnh nhân</div>
              <div className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">{appointment.patientNotes}</div>
            </div>
          )}

          {patientFull?.medicalHistory && patientFull.medicalHistory.length > 0 && (
            <div>
              <div className="text-muted-foreground text-sm">Tiền sử bệnh</div>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {patientFull.medicalHistory.slice(0, 3).map((m: any, i: number) => (
                  <li key={i}>{m.condition}{m.diagnosedDate ? ` (${new Date(m.diagnosedDate).getFullYear()})` : ''}{m.treatment ? ` — ${m.treatment}` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-3 justify-end">
            {!isPatient && appointment.status === 'scheduled' && (
              <Button onClick={() => { if (onConfirm) onConfirm(appointment._id); onOpenChange(false); }}>
                Xác nhận
              </Button>
            )}

            {!isPatient && (appointment.status === 'in_progress' || appointment.status === 'confirmed') && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (!canComplete) {
                    toast.error('Chỉ có thể hoàn thành khi đến thời gian khám hoặc sau giờ bắt đầu');
                    return;
                  }
                  setShowCompleteForm(true);
                }}
                disabled={!canComplete}
                title={!canComplete ? 'Bạn chỉ có thể hoàn thành khi đến thời gian khám' : ''}
              >
                {canComplete ? 'Hoàn thành khám' : 'Chưa đến giờ'}
              </Button>
            )}

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </div>

          {showCompleteForm && (
            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setShowCompleteForm(false)} />
              <div className="relative z-50 bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-semibold mb-3">Xác nhận thời gian hoàn thành</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Bắt đầu</label>
                    <input type="time" value={examStart} onChange={(e) => setExamStart(e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Kết thúc</label>
                    <input type="time" value={examEnd} onChange={(e) => setExamEnd(e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompleteForm(false)}>Hủy</Button>
                  <Button onClick={async () => {
                    // basic validation
                    if (!examStart || !examEnd) return alert('Vui lòng chọn thời gian bắt đầu và kết thúc');
                    if (examStart > examEnd) return alert('Thời gian bắt đầu phải trước thời gian kết thúc');

                    const startISO = `${scheduledDateStr}T${examStart}:00`;
                    const endISO = `${scheduledDateStr}T${examEnd}:00`;

                    // Enforce start time at or after scheduled time
                    if (scheduled && new Date(startISO).getTime() < scheduled.getTime()) {
                      return alert('Thời gian bắt đầu phải là thời gian khám hoặc sau thời gian đã đặt');
                    }

                    if (onComplete) await onComplete(appointment._id, startISO, endISO);
                    setShowCompleteForm(false);
                    onOpenChange(false);
                  }}>Lưu & Hoàn thành</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
