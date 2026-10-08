import Calendar from '@/components/labs/Calendar';
import { useMounted } from '@/lib/useMounted';

function CalendarPage() {
  return useMounted() ? <Calendar /> : null;
}
CalendarPage.layout = 'full' as const;
export default CalendarPage;
