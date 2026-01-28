import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface AnalyticsChartProps {
    data: any[];
    title: string;
}

const AnalyticsChart = ({ data, title }: AnalyticsChartProps) => {
    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(232,62,112,0.4)]" />
                        <span className="text-sm font-black text-slate-900 tracking-tight">Real-time Prodaja</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                    <Badge variant="outline" className="rounded-full border-none bg-white font-bold text-[10px] uppercase tracking-wider shadow-sm text-slate-600">Zadnjih 30 dana</Badge>
                </div>
            </div>

            <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e83e70" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#e83e70" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight={800}
                            tickLine={false}
                            axisLine={false}
                            tick={{ dy: 15 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            fontWeight={800}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `€${value}`}
                            tick={{ dx: -10 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: 'none',
                                borderRadius: '20px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                color: '#fff',
                                padding: '20px'
                            }}
                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }}
                            itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900', marginTop: '4px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'black', letterSpacing: '0.1em', marginBottom: '8px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#e83e70"
                            strokeWidth={5}
                            fill="url(#lineGradient)"
                            dot={{ r: 6, fill: '#fff', stroke: '#e83e70', strokeWidth: 3 }}
                            activeDot={{ r: 8, fill: '#e83e70', stroke: '#fff', strokeWidth: 3 }}
                            animationDuration={2000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsChart;
