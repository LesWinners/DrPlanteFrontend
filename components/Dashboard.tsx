import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardScanData, dashboardDiseaseData } from '../constants';
import { motion, type Variants } from 'framer-motion';

const Dashboard: React.FC = () => {
    
  const cardVariants: Variants = {
    offscreen: {
      y: 50,
      opacity: 0
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8
      }
    }
  };

  return (
    <div className="p-4 space-y-6">
       <motion.div 
        className="bg-white p-4 rounded-2xl shadow-lg"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.8 }}
        variants={cardVariants}
       >
        <h3 className="text-lg font-bold text-brand-green-dark mb-4">Historique des Scans</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={dashboardScanData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#582F0E" fontSize={12} />
                    <YAxis stroke="#582F0E" fontSize={12} />
                    <Tooltip wrapperClassName="rounded-md border-gray-300 shadow-lg" />
                    <Legend wrapperStyle={{fontSize: "14px"}} />
                    <Bar dataKey="scans" fill="#588157" name="Scans" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </motion.div>
      
       <motion.div 
        className="bg-white p-4 rounded-2xl shadow-lg"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.8 }}
        variants={cardVariants}
       >
        <h3 className="text-lg font-bold text-brand-green-dark mb-4">Types de Maladies Détectées</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                 <PieChart>
                    <Pie data={dashboardDiseaseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}>
                         {dashboardDiseaseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                         ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize: "14px"}} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </motion.div>

       <motion.div 
        className="bg-white p-4 rounded-2xl shadow-lg"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.8 }}
        variants={cardVariants}
       >
        <h3 className="text-lg font-bold text-brand-green-dark mb-4">Historique des Actions</h3>
         <ul className="space-y-3 text-gray-700">
            <li className="flex items-center"><span className="text-green-500 mr-2">✅</span> Traitement appliqué pour le mildiou (Tomate)</li>
            <li className="flex items-center"><span className="text-green-500 mr-2">✅</span> Irrigation optimisée (Maïs)</li>
            <li className="flex items-center"><span className="text-yellow-500 mr-2">⚠️</span> Surveillance de la rouille (Blé)</li>
         </ul>
      </motion.div>
    </div>
  );
};

export default Dashboard;