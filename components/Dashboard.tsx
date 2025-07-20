import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardScanData, dashboardDiseaseData } from '../constants';
import { motion, type Variants } from 'framer-motion';
import { BACKEND_URL } from '../constants';

const Dashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanData, setScanData] = useState([]);
  const [diseaseData, setDiseaseData] = useState([]);
    
  // Récupérer les analyses depuis l'API
  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/analyses`);
        const data = await response.json();
        setAnalyses(data);
        processData(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des analyses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  // Traiter les données pour les graphiques
  const processData = (analysesData) => {
    // Données pour l'historique des scans (par mois)
    const monthlyData = {};
    analysesData.forEach(analysis => {
      const date = new Date(analysis.timestamp);
      const monthYear = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });

    const scanChartData = Object.entries(monthlyData).map(([name, scans]) => ({
      name,
      scans
    }));

    // Données pour les types de maladies
    const diseaseCounts = {};
    analysesData.forEach(analysis => {
      const disease = analysis.diseaseName || 'Non détecté';
      diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
    });

    // Trie les maladies par nombre d'occurrences décroissant
    const sortedDiseases = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1]);
    const top5 = sortedDiseases.slice(0, 5);
    const autres = sortedDiseases.slice(5);
    let autresTotal = 0;
    autres.forEach(([_, value]) => { autresTotal += value; });

    const colors = [
      '#7C3E10', // Terre argileuse
      '#D4A373', // Sable chaud
      '#A3B18A', // Feuillage clair
      '#588157', // Vert forêt (conservé)
      '#F4A261', // Soleil couchant / patate douce
      '#B5838D', // Terres ferrugineuses 
    ];

    const diseaseChartData = top5.map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length]
    }));
    if (autresTotal > 0) {
      diseaseChartData.push({
        name: 'Autres',
        value: autresTotal,
        fill: '#E9C46A'
      });
    }

    setScanData(scanChartData);
    setDiseaseData(diseaseChartData);
  };

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

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-4 animate-pulse">
          <svg
            className="w-12 h-12 text-emerald-600 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <h2 className="text-lg font-semibold text-emerald-700">
            Veuillez patienter...
          </h2>
          <p className="text-sm text-emerald-800 opacity-80 text-center">
            Vos statistiques sont en cours de chargement...
          </p>
        </div>
      </div>
    );
    
  }

  const pieData = Array.isArray(diseaseData) && diseaseData.length > 0 ? diseaseData : (Array.isArray(dashboardDiseaseData) ? dashboardDiseaseData : []);

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
                <BarChart data={scanData.length > 0 ? scanData : dashboardScanData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
        className="bg-white p-6 rounded-2xl shadow-lg"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.8 }}
        variants={cardVariants}
       >
        <h3 className="text-lg font-bold text-brand-green-dark mb-6">Résultats obtenus</h3>
        <div style={{ width: '100%', height: 400, padding: '10px 0' }}>
            <ResponsiveContainer>
                 <PieChart>
                    <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={110}
                        innerRadius={35}
                        paddingAngle={2}
                        labelLine={false} 
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                            
                            // Afficher le pourcentage seulement si la section est assez grande
                            if (percent > 0.05) {
                                return (
                                    <text 
                                        x={x} 
                                        y={y} 
                                        fill="white" 
                                        textAnchor="middle" 
                                        dominantBaseline="central" 
                                        fontSize="12"
                                        fontWeight="bold"
                                        stroke="rgba(0,0,0,0.3)"
                                        strokeWidth="0.5"
                                    >
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }
                            return null;
                        }}
                    >
                         {pieData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill} 
                                stroke="#ffffff" 
                                strokeWidth={2}
                            />
                         ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value, name) => [`${value} analyses`, name]}
                        labelStyle={{ color: '#582F0E', fontWeight: 'bold' }}
                        contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <Legend 
                        wrapperStyle={{
                            fontSize: "13px",
                            paddingTop: "20px"
                        }}
                        formatter={(value, entry) => (
                            <span style={{ color: '#582F0E', fontWeight: '500' }}>
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;