import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ActiveQRResponse } from '@/services/qrCodeService';

export const useQRCodeStatus = (courseId?: string) => {
  const [activeQRCode, setActiveQRCode] = useState<ActiveQRResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setActiveQRCode(null);
      setTimeLeft(0);
      return;
    }

    // Get initial QR code status
    const getActiveQRCode = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('check_in_prompts')
          .select('*')
          .eq('course_id', courseId)
          .gte('expires_at', Date.now())
          .order('created_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.log('QR Code Status: No active QR code found', error);
          setActiveQRCode(null);
          setTimeLeft(0);
        } else if (data) {
          const remaining = Math.max(0, Math.floor((data.expires_at - Date.now()) / 1000));
          setActiveQRCode({
            id: data.id,
            courseId: data.course_id,
            courseName: data.course_name,
            expiresAt: data.expires_at,
            timeLeft: remaining
          });
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error('QR Code Status: Error getting active QR code', error);
        setActiveQRCode(null);
        setTimeLeft(0);
      } finally {
        setIsLoading(false);
      }
    };

    getActiveQRCode();

    // Subscribe to QR code changes
    const subscription = supabase
      .channel('qr-code-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_in_prompts',
          filter: `course_id=eq.${courseId}`
        },
        (payload) => {
          console.log('QR Code Status: Real-time update received', payload);
          
          if (payload.eventType === 'INSERT') {
            const remaining = Math.max(0, Math.floor((payload.new.expires_at - Date.now()) / 1000));
            setActiveQRCode({
              id: payload.new.id,
              courseId: payload.new.course_id,
              courseName: payload.new.course_name,
              expiresAt: payload.new.expires_at,
              timeLeft: remaining
            });
            setTimeLeft(remaining);
          } else if (payload.eventType === 'DELETE') {
            setActiveQRCode(null);
            setTimeLeft(0);
          } else if (payload.eventType === 'UPDATE') {
            const remaining = Math.max(0, Math.floor((payload.new.expires_at - Date.now()) / 1000));
            setActiveQRCode({
              id: payload.new.id,
              courseId: payload.new.course_id,
              courseName: payload.new.course_name,
              expiresAt: payload.new.expires_at,
              timeLeft: remaining
            });
            setTimeLeft(remaining);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [courseId]);

  // Countdown timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeQRCode && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setActiveQRCode(null);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeQRCode, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { 
    activeQRCode, 
    timeLeft, 
    isLoading,
    formattedTime: formatTime(timeLeft),
    hasActiveQR: activeQRCode !== null && timeLeft > 0
  };
}; 