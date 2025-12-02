import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2, AlertCircle, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';

interface FeaturedItem {
  id: number;
  egi_id: number;
  egi_name: string;
  date: string;
  slot: 'morning' | 'afternoon' | 'evening';
  priority: number;
}

interface FeaturedCalendarResponse {
  featured: FeaturedItem[];
  month: number;
  year: number;
}

export default function FeaturedCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data, isLoading, error } = useQuery<FeaturedCalendarResponse>({
    queryKey: ['platform-featured-calendar', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => api.get(`/superadmin/platform/featured-calendar?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`).then(res => res.data),
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle className="w-6 h-6" />
        <span>Errore nel caricamento del calendario. Assicurati che il backend EGI sia attivo.</span>
      </div>
    );
  }

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Featured Calendar</h1>
          <p className="text-base-content/60">Pianifica gli EGI in evidenza</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi Featured
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-6">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
              <div key={day} className="text-center font-semibold text-base-content/60 py-2">
                {day}
              </div>
            ))}
            {/* Calendar days would be rendered here */}
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="aspect-square border border-base-300 rounded-lg p-1 hover:bg-base-200 cursor-pointer">
                <div className="text-xs text-base-content/60">{(i % 31) + 1}</div>
                {data?.featured?.filter(f => new Date(f.date).getDate() === (i % 31) + 1).map(item => (
                  <div key={item.id} className="text-xs bg-primary/20 text-primary rounded px-1 truncate mt-1">
                    <Star className="w-3 h-3 inline mr-1" />
                    {item.egi_name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">EGI in Evidenza questo Mese</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>EGI</th>
                  <th>Data</th>
                  <th>Slot</th>
                  <th>Priorità</th>
                </tr>
              </thead>
              <tbody>
                {data?.featured?.length ? (
                  data.featured.map((item) => (
                    <tr key={item.id}>
                      <td>{item.egi_name}</td>
                      <td>{new Date(item.date).toLocaleDateString('it-IT')}</td>
                      <td><span className="badge badge-ghost">{item.slot}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: item.priority }, (_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/60">
                      Nessun EGI in evidenza questo mese
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
