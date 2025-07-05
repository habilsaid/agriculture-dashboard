import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Bar, Pie } from 'react-chartjs-2'
import { 
  FiLogOut, 
  FiUser, 
  FiBarChart2, 
  FiDroplet, 
  FiThermometer, 
  FiSun,
  FiSettings,
  FiBell,
  FiHelpCircle,
  FiCalendar,
  FiTrendingUp,
  FiMap,
  FiAward,
  FiRefreshCw
} from 'react-icons/fi'
import { motion } from 'framer-motion'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import moment from 'moment'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

const localizer = momentLocalizer(moment)

// Sample data - replace with your actual data
const fieldCoordinates = [
  { id: 1, name: 'North Field', lat: -1.939826, lng: 30.044542, crop: 'Wheat', area: '2.5 ha' },
  { id: 2, name: 'South Field', lat: -1.936, lng: 30.06, crop: 'Maize', area: '3.2 ha' },
  { id: 3, name: 'East Field', lat: -1.95, lng: 30.05, crop: 'Rice', area: '1.8 ha' }
]

const calendarEvents = [
  {
    id: 1,
    title: 'Plant Wheat - North Field',
    start: new Date(2023, 9, 15),
    end: new Date(2023, 9, 15),
    crop: 'Wheat',
    field: 'North Field'
  },
  {
    id: 2,
    title: 'Fertilize Maize',
    start: new Date(2023, 9, 20),
    end: new Date(2023, 9, 20),
    crop: 'Maize',
    field: 'South Field'
  },
  {
    id: 3,
    title: 'Harvest Rice',
    start: new Date(2023, 10, 5),
    end: new Date(2023, 10, 7),
    crop: 'Rice',
    field: 'East Field'
  }
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState(3)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetchPredictions()
    
    const subscription = supabase
      .channel('predictions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => fetchPredictions()
      )
      .subscribe()

    return () => supabase.removeChannel(subscription)
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

  // Calculate average yield
  const averageYield = predictions.length > 0 
    ? (predictions.reduce((sum, p) => sum + p.yield, 0) / predictions.length).toFixed(2)
    : 0

  const latestPrediction = predictions[0]

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
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderWidth: 1
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-green-600 flex items-center">
                <FiAward className="mr-2" /> AgriVision
              </h1>
              <p className="text-sm text-gray-500">Smart Agriculture Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div 
            className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FiUser />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.email}</p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
            <FiSettings className="text-gray-400" />
          </div>
          
          {profileOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white rounded-md shadow-lg py-1"
            >
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile Settings</a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Account Security</a>
              <button 
                onClick={signOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'overview' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <FiBarChart2 className="mr-3" />
            Overview
            {activeTab === 'overview' && (
              <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'predictions' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <FiThermometer className="mr-3" />
            Predictions
            {activeTab === 'predictions' && (
              <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'analytics' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <FiTrendingUp className="mr-3" />
            Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'map' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <FiMap className="mr-3" />
            Field Map
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'calendar' ? 'bg-green-100 text-green-600' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <FiCalendar className="mr-3" />
            Crop Calendar
          </button>
        </nav>
        
        {/* Help & Support */}
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FiHelpCircle className="mr-3" />
            Help & Support
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'predictions' && 'Crop Predictions'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'map' && 'Field Map'}
              {activeTab === 'calendar' && 'Crop Calendar'}
            </h2>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <FiBell />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <FiUser size={16} />
                </div>
                <span className="text-sm font-medium">{user?.email.split('@')[0]}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard 
                      icon={<FiBarChart2 size={20} />}
                      title="Total Predictions"
                      value={predictions.length}
                      trend="+12% from last week"
                      color="blue"
                    />
                    
                    <StatCard 
                      icon={<FiDroplet size={20} />}
                      title="Latest Yield"
                      value={latestPrediction ? `${latestPrediction.yield.toFixed(2)} tons/ha` : 'N/A'}
                      trend={latestPrediction ? `${(latestPrediction.confidence * 100).toFixed(1)}% confidence` : ''}
                      color="green"
                    />
                    
                    <StatCard 
                      icon={<FiSun size={20} />}
                      title="Latest Crop"
                      value={latestPrediction?.crop_type || 'N/A'}
                      trend="Most frequent: Wheat"
                      color="yellow"
                    />
                    
                    <StatCard 
                      icon={<FiTrendingUp size={20} />}
                      title="Average Yield"
                      value={`${averageYield} tons/ha`}
                      trend="+5% from last month"
                      color="purple"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard 
                      title="Yield by Crop Type"
                      description="Comparison of yield predictions across different crops"
                    >
                      <Bar 
                        data={yieldData} 
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.parsed.y} tons/ha`
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: {
                                display: true,
                                text: 'Tons per hectare'
                              }
                            }
                          }
                        }} 
                      />
                    </ChartCard>
                    
                    <ChartCard 
                      title="Crop Distribution"
                      description="Frequency of predicted crop types"
                    >
                      <Pie 
                        data={cropDistribution} 
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right'
                            }
                          }
                        }} 
                      />
                    </ChartCard>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-medium mb-4 flex items-center">
                      <FiCalendar className="mr-2" /> Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {predictions.slice(0, 5).map((prediction, index) => (
                        <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
                          <div className="bg-green-100 p-2 rounded-full mr-3">
                            <FiThermometer className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">
                                {prediction.crop_type} prediction recorded
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(prediction.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Yield: {prediction.yield.toFixed(2)} tons/ha • Confidence: {(prediction.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Predictions Tab */}
              {activeTab === 'predictions' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium">Recent Predictions</h3>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        Export Data
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        Filter
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {predictions.map((prediction) => (
                          <tr key={prediction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  prediction.crop_type === 'Wheat' ? 'bg-amber-400' :
                                  prediction.crop_type === 'Maize' ? 'bg-green-400' :
                                  prediction.crop_type === 'Rice' ? 'bg-blue-400' : 'bg-purple-400'
                                }`}></div>
                                <span className="font-medium">{prediction.crop_type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FiTrendingUp className={`mr-1 ${
                                  prediction.yield > 30 ? 'text-green-500' : 'text-yellow-500'
                                }`} />
                                {prediction.yield.toFixed(2)} tons/ha
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className={`h-2.5 rounded-full ${
                                      prediction.confidence > 0.7 ? 'bg-green-500' : 
                                      prediction.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${prediction.confidence * 100}%` }}
                                  ></div>
                                </div>
                                <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(prediction.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">{predictions.length}</span> results
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
                        Previous
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard 
                      title="Yield Trend (Last 30 Days)"
                      description="Daily yield predictions over time"
                    >
                      <Bar 
                        data={{
                          labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
                          datasets: [
                            {
                              label: 'Yield (tons/ha)',
                              data: Array.from({ length: 30 }, () => Math.random() * 10 + 25),
                              backgroundColor: 'rgba(54, 162, 235, 0.6)',
                              borderColor: 'rgba(54, 162, 235, 1)',
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              title: {
                                display: true,
                                text: 'Tons per hectare'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Day'
                              }
                            }
                          }
                        }}
                      />
                    </ChartCard>

                    <ChartCard 
                      title="Crop Health Indicators"
                      description="Key metrics for crop health assessment"
                    >
                      <Pie 
                        data={{
                          labels: ['Soil Moisture', 'Nutrients', 'Pest Control', 'Growth Rate'],
                          datasets: [
                            {
                              data: [85, 78, 92, 81],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(255, 206, 86, 0.6)',
                                'rgba(153, 102, 255, 0.6)'
                              ],
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false
                        }}
                      />
                    </ChartCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard 
                      title="Soil Conditions"
                      description="Current soil metrics across fields"
                      className="h-full"
                    >
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">pH Level</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-green-500" 
                                style={{ width: '70%' }}
                              ></div>
                            </div>
                            <span>6.8 (Optimal)</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Nitrogen</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-yellow-500" 
                                style={{ width: '45%' }}
                              ></div>
                            </div>
                            <span>45 ppm (Low)</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Moisture</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="h-2.5 rounded-full bg-blue-500" 
                                style={{ width: '82%' }}
                              ></div>
                            </div>
                            <span>82% (Good)</span>
                          </div>
                        </div>
                      </div>
                    </ChartCard>

                    <ChartCard 
                      title="Weather Forecast"
                      description="7-day weather prediction"
                      className="h-full"
                    >
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                          <div key={day} className="flex justify-between items-center">
                            <span className="text-sm">Day {day}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">24°C</span>
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiSun className="text-yellow-500 text-xs" />
                              </div>
                              <span className="text-sm text-gray-500">10% rain</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ChartCard>

                    <ChartCard 
                      title="Resource Allocation"
                      description="Current resource distribution"
                      className="h-full"
                    >
                      <Pie 
                        data={{
                          labels: ['Water', 'Fertilizer', 'Labor', 'Equipment'],
                          datasets: [
                            {
                              data: [35, 25, 20, 20],
                              backgroundColor: [
                                'rgba(54, 162, 235, 0.6)',
                                'rgba(75, 192, 192, 0.6)',
                                'rgba(255, 159, 64, 0.6)',
                                'rgba(153, 102, 255, 0.6)'
                              ],
                              borderWidth: 1
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right'
                            }
                          }
                        }}
                      />
                    </ChartCard>
                  </div>
                </div>
              )}
              
              {/* Field Map Tab */}
              {activeTab === 'map' && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Field Locations</h3>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">
                          Add Field
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                          Filter
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-96 rounded-lg overflow-hidden">
                      <MapContainer 
                        center={[-1.939, 30.044]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {fieldCoordinates.map(field => (
                          <Marker key={field.id} position={[field.lat, field.lng]}>
                            <Popup>
                              <div className="space-y-1">
                                <h4 className="font-medium">{field.name}</h4>
                                <p>Crop: {field.crop}</p>
                                <p>Area: {field.area}</p>
                                <button className="text-sm text-green-600 hover:underline">
                                  View Details
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fieldCoordinates.map(field => (
                        <div key={field.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h4 className="font-medium flex items-center">
                            <span className={`w-3 h-3 rounded-full mr-2 ${
                              field.crop === 'Wheat' ? 'bg-amber-400' :
                              field.crop === 'Maize' ? 'bg-green-400' :
                              'bg-blue-400'
                            }`}></span>
                            {field.name}
                          </h4>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Crop: {field.crop}</p>
                            <p>Area: {field.area}</p>
                            <p>Coordinates: {field.lat.toFixed(4)}, {field.lng.toFixed(4)}</p>
                          </div>
                          <div className="mt-3 flex space-x-2">
                            <button className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                              View Analytics
                            </button>
                            <button className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">
                              Schedule Task
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Crop Calendar Tab */}
              {activeTab === 'calendar' && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Crop Management Calendar</h3>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">
                          Add Event
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                          Export
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-[600px]">
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={(event) => ({
                          style: {
                            backgroundColor: 
                              event.crop === 'Wheat' ? '#f59e0b' :
                              event.crop === 'Maize' ? '#10b981' : '#3b82f6',
                            borderRadius: '4px',
                            border: 'none',
                            color: 'white'
                          }
                        })}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Upcoming Activities</h4>
                      <div className="space-y-3">
                        {calendarEvents.slice(0, 3).map(event => (
                          <div key={event.id} className="border-l-4 pl-3 py-1" style={{
                            borderLeftColor: 
                              event.crop === 'Wheat' ? '#f59e0b' :
                              event.crop === 'Maize' ? '#10b981' : '#3b82f6'
                          }}>
                            <div className="flex justify-between">
                              <h5 className="font-medium">{event.title}</h5>
                              <span className="text-sm text-gray-500">
                                {moment(event.start).format('MMM D')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{event.field}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium mb-3">Crop Rotation Schedule</h4>
                      <div className="space-y-2">
                        {[
                          { field: 'North Field', current: 'Wheat', next: 'Legumes', date: 'Nov 2023' },
                          { field: 'South Field', current: 'Maize', next: 'Wheat', date: 'Dec 2023' },
                          { field: 'East Field', current: 'Rice', next: 'Maize', date: 'Jan 2024' }
                        ].map((rotation, i) => (
                          <div key={i} className="flex items-center p-2 hover:bg-gray-50 rounded">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <FiRefreshCw className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{rotation.field}</p>
                              <p className="text-xs text-gray-500">
                                {rotation.current} → {rotation.next} ({rotation.date})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium mb-3">Harvest Timeline</h4>
                      <div className="space-y-3">
                        {[
                          { crop: 'Wheat', field: 'North Field', start: 'Nov 15', end: 'Nov 20' },
                          { crop: 'Maize', field: 'South Field', start: 'Dec 1', end: 'Dec 5' },
                          { crop: 'Rice', field: 'East Field', start: 'Jan 10', end: 'Jan 15' }
                        ].map((harvest, i) => (
                          <div key={i} className="flex items-start">
                            <div className={`w-3 h-3 rounded-full mt-1 mr-2 ${
                              harvest.crop === 'Wheat' ? 'bg-amber-400' :
                              harvest.crop === 'Maize' ? 'bg-green-400' : 'bg-blue-400'
                            }`}></div>
                            <div>
                              <p className="font-medium text-sm">{harvest.crop} Harvest</p>
                              <p className="text-xs text-gray-500">{harvest.field}</p>
                              <p className="text-xs text-gray-500">
                                {harvest.start} - {harvest.end}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

// Reusable Stat Card Component
function StatCard({ icon, title, value, trend, color = 'blue' }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' }
  }
  return (
    <div className={`${colors[color].bg} p-6 rounded-lg transition-all hover:shadow-md`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colors[color].iconBg} ${colors[color].text} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {trend && (
            <p className="text-xs mt-1 text-gray-500">{trend}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable Chart Card Component
function ChartCard({ title, description, children }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="mb-4">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="h-80">
        {children}
      </div>
    </div>
  )
}


