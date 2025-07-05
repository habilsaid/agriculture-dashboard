import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Chart, registerables } from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import { 
  FiLogOut, 
  FiUser, 
  FiBarChart2, 
  FiDroplet, 
  FiThermometer, 
  FiSun 
} from 'react-icons/fi'
import { motion } from 'framer-motion'

// Register all Chart.js components
Chart.register(...registerables)

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchPredictions()
  }, [])

  async function fetchPredictions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPredictions(data || [])
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chart data
  const yieldData = {
    labels: predictions.map(p => p.crop_type),
    datasets: [
      {
        label: 'Yield (tons/ha)',
        data: predictions.map(p => p.yield),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  }

  const cropDistribution = {
    labels: [...new Set(predictions.map(p => p.crop_type))],
    datasets: [
      {
        label: 'Crop Distribution',
        data: [...new Set(predictions.map(p => p.crop_type))].map(
          crop => predictions.filter(p => p.crop_type === crop).length
        ),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const latestPrediction = predictions[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-green-600">AgriVision</h1>
          <p className="text-sm text-gray-500">Smart Agriculture Dashboard</p>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FiUser />
            </div>
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FiBarChart2 className="mr-3" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'predictions' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <FiThermometer className="mr-3" />
            Predictions
          </button>
          
          <button
            onClick={signOut}
            className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 mt-4"
          >
            <FiLogOut className="mr-3" />
            Sign Out
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FiBarChart2 size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Predictions</p>
                      <p className="text-2xl font-semibold">{predictions.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FiDroplet size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Latest Yield</p>
                      <p className="text-2xl font-semibold">
                        {latestPrediction ? `${latestPrediction.yield.toFixed(2)} tons/ha` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <FiSun size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Latest Crop</p>
                      <p className="text-2xl font-semibold">
                        {latestPrediction?.crop_type || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
                  <h3 className="font-medium mb-4">Yield by Crop Type</h3>
                  <Bar 
                    data={yieldData} 
                    options={chartOptions}
                    key={`bar-${predictions.length}`}
                  />
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 h-96">
                  <h3 className="font-medium mb-4">Crop Distribution</h3>
                  <Pie 
                    data={cropDistribution} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      }
                    }}
                    key={`pie-${predictions.length}`}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'predictions' && (
            <div>
              <h3 className="font-medium mb-4">Recent Predictions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {predictions.map((prediction) => (
                      <tr key={prediction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prediction.crop_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {prediction.yield.toFixed(2)} tons/ha
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="h-2 w-full bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-green-500 rounded-full" 
                                style={{ width: `${prediction.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2">{(prediction.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(prediction.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}