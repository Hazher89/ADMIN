'use client';

import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Clock, 
  Package, 
  Truck, 
  User, 
  Settings, 
  Search,
  Plus,
  Zap,
  Navigation,
  Route,
  Calendar,
  BarChart3,
  GanttChart,
  Wifi,
  WifiOff,
  ChevronRight,
  Users,
  TrendingUp,
  Building2,
  Menu,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Play,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Target,
  MapPin,
  Timer,
  DollarSign,
  Percent,
  Activity,
  Layers,
  Globe,
  Star,
  Bookmark,
  Tag,
  Hash,
  Phone,
  Mail,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  QrCode,
  Scan,
  Shield,
  Award,
  Trophy,
  Crown,
  Diamond,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Mountain,
  TreePine,
  Waves,
  Compass,
  Globe2,
  World,
  Flag,
  Home,
  Building,
  Factory,
  Warehouse,
  Store,
  ShoppingCart,
  CreditCard,
  Euro,
  Percent as PercentIcon,
  Calculator,
  FileText,
  File,
  Folder,
  FolderOpen,
  Archive,
  Bookmark as BookmarkIcon,
  Tag as TagIcon,
  Tags,
  AtSign,
  Link,
  Link2,
  Share,
  Share2,
  Send,
  MessageCircle,
  Video,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Gamepad2,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  HardDrive,
  Server,
  Router,
  Bluetooth,
  Usb,
  Cable,
  Plug,
  Power,
  Lightbulb,
  Lamp,
  Flashlight,
  Candle,
  Flame,
  Fire,
  Snowflake,
  CloudLightning,
  CloudDrizzle,
  Sunrise,
  Sunset,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  TreeDeciduous,
  Flower,
  Leaf,
  Seedling,
  Trees,
  Forest,
  Park,
  Garden,
  Farm,
  Wheat,
  Corn,
  Apple,
  Banana,
  Cherry,
  Grape,
  Orange,
  Peach,
  Pear,
  Pineapple,
  Strawberry,
  Watermelon,
  Carrot,
  Eggplant,
  Pepper,
  Potato,
  Tomato,
  Broccoli,
  Cabbage,
  Lettuce,
  Onion,
  Peas,
  Radish,
  Spinach,
  Squash,
  Beet,
  Cucumber,
  Garlic,
  Ginger,
  Mushroom,
  Olive,
  Pickle,
  Pumpkin,
  Turnip,
  Avocado,
  Coconut,
  Kiwi,
  Lemon,
  Lime,
  Mango,
  Melon,
  Papaya,
  Pomegranate,
  Raspberry,
  Blueberry,
  Blackberry,
  Cranberry,
  Fig,
  Raisin,
  Prune,
  Apricot,
  Plum,
  Persimmon,
  Dragonfruit,
  Starfruit,
  Passionfruit,
  Guava,
  Lychee,
  Rambutan,
  Durian,
  Jackfruit,
  Breadfruit,
  Plantain,
  Taro,
  Yam,
  SweetPotato,
  Cassava,
  Arrowroot,
  Lotus,
  Bamboo,
  Cactus,
  Aloe,
  Lavender,
  Rose,
  Tulip,
  Daisy,
  Sunflower,
  Orchid,
  Lily,
  Iris,
  Poppy,
  Daffodil,
  Hyacinth,
  Peony,
  Magnolia,
  Jasmine,
  Hibiscus,
  Marigold,
  Petunia,
  Geranium,
  Begonia,
  Impatiens,
  Pansy,
  Violet,
  Primrose,
  Snapdragon,
  Zinnia,
  Cosmos,
  Aster,
  Chrysanthemum,
  Carnation,
  Gladiolus,
  Freesia,
  Anemone,
  Ranunculus,
  Delphinium,
  Lupine,
  Foxglove,
  Digitalis,
  Bellflower,
  Campanula,
  Lobelia,
  Verbena,
  Salvia,
  Sage,
  Rosemary,
  Thyme,
  Oregano,
  Basil,
  Mint,
  Parsley,
  Cilantro,
  Dill,
  Chives,
  Tarragon,
  Bay,
  Cinnamon,
  Nutmeg,
  Clove,
  Cardamom,
  Vanilla,
  Turmeric,
  Saffron,
  Paprika,
  Cayenne,
  BlackPepper,
  WhitePepper,
  PinkPepper,
  Allspice,
  Juniper,
  StarAnise,
  Fennel,
  Cumin,
  Coriander,
  Mustard,
  Sesame,
  Caraway,
  Anise,
  Licorice,
  Chicory,
  Endive,
  Escarole,
  Radicchio,
  Arugula,
  Watercress,
  Mache,
  Sorrel,
  Purslane,
  Lamb,
  SwissChard,
  Kale,
  Collard,
  BokChoy,
  Napa,
  Daikon,
  Horseradish,
  Wasabi,
  Galangal,
  Lemongrass,
  KaffirLime,
  Makrut,
  Buddha,
  Bergamot,
  Yuzu,
  Kumquat,
  Tangerine,
  Clementine,
  Mandarine,
  Satsuma,
  Ugli,
  Minneola,
  Tangelo,
  Grapefruit,
  Pomelo,
  Shaddock,
  Citron,
  Etrog,
  Sukkot,
  Lulav,
  Hadas,
  Arava,
  Esrog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdvancedPlanningPage() {
  const { userProfile } = useAuth();
  
  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'drivers' | 'routes'>('drivers');
  const [selectedDate, setSelectedDate] = useState('2 Nov - 9 Nov');
  const [viewMode, setViewMode] = useState('daily');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [mapDisplay, setMapDisplay] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [taskSortBy, setTaskSortBy] = useState('Created');
  const [driverSortBy, setDriverSortBy] = useState('First name');
  const [showVideo, setShowVideo] = useState(true);
  
  // Sample data
  const tasks = [
    {
      id: 'T-IH4CHACL',
      time: 'Nov 1 @ 14:57 pm',
      pickup: 'City Social, Tower 42, 25 Old Broad St, London EC2N 1HQ',
      delivery: 'Fox Rodney Se, 1 Royal Exchange Ave, London EC4N 6EU',
      value: 740,
      date: 'Nov 2 8:00-9:45',
      skills: 'No required skills/capabilities',
      cost: '-S10:07',
      status: 'Unviable',
      driver: 'Unassigned'
    },
    {
      id: 'T-5GGM06EF',
      time: 'Nov 1 @ 14:08 pm',
      pickup: 'The Garden Cafe, 2-4 Southwark Bridge Rd, London SE1 7LB',
      delivery: 'Ove Arup & Partners, 13 Fitzroy St, London W1T 4BQ',
      value: 20,
      date: 'Nov 2',
      skills: 'No required skills',
      cost: '-S10:03 Team 2',
      status: 'Created',
      driver: 'John Smith | Created | ETA: Nov 2 @ 11:25'
    }
  ];

  const drivers = [
    {
      id: 'RT-231102-069387',
      name: 'Ben Richardson',
      vehicle: 'Vehicle 0',
      load: '0/10',
      utilization: [97, 97],
      distance: '8.3 km',
      hours: '8:00-17:00',
      cost: '$402',
      speed: 'Fast',
      team: 'Team 2',
      skills: []
    },
    {
      id: 'RT-231102-069388',
      name: 'Charles Snider',
      vehicle: 'Vehicle 1',
      load: '8/10',
      utilization: [94],
      distance: '105.1 km',
      hours: '8:00-17:00',
      cost: '$624',
      speed: 'Fast',
      team: 'Team 2',
      skills: ['Skill A', 'Skill B', 'Skill C', 'Skill D']
    }
  ];

  const driverSchedules = [
    {
      name: 'John Smith',
      load: 96,
      tasks: [1, 2, 3]
    },
    {
      name: 'Sam Stevens',
      load: 99,
      tasks: [4, 5, 6, 7]
    },
    {
      name: 'Ben Richardson',
      load: 94,
      tasks: [12, 13, 14, 15, 16, 17]
    }
  ];

  // Initialize
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <p className="text-white text-lg">Loading Advanced Planning System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-blue-900 px-4 py-3 flex items-center justify-between border-b border-blue-800">
        <div className="flex items-center space-x-6">
          {/* Date Navigation */}
          <div className="flex items-center space-x-2">
            <button className="p-1 text-blue-200 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-medium">{selectedDate}</span>
            <button className="p-1 text-blue-200 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <button 
            onClick={() => setViewMode(viewMode === 'daily' ? 'weekly' : 'daily')}
            className="px-3 py-1 bg-blue-800 text-white rounded text-sm hover:bg-blue-700"
          >
            {viewMode === 'daily' ? 'Daily' : 'Weekly'}
          </button>

          {/* Teams Dropdown */}
          <div className="relative">
            <select 
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-blue-800 text-white px-3 py-1 rounded text-sm border-none focus:outline-none"
            >
              <option value="All Teams">Teams</option>
              <option value="Team 1">Team 1</option>
              <option value="Team 2">Team 2</option>
            </select>
          </div>

          {/* Map Display Dropdown */}
          <div className="relative">
            <select 
              value={mapDisplay}
              onChange={(e) => setMapDisplay(e.target.value)}
              className="bg-blue-800 text-white px-3 py-1 rounded text-sm border-none focus:outline-none"
            >
              <option value="All">Map Display</option>
              <option value="Routes">Routes</option>
              <option value="Tasks">Tasks</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Planning Overview */}
          <div className="flex items-center space-x-2 text-white">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Planning overview</span>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for drivers/vehicles/routes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-blue-800 text-white placeholder-blue-200 px-3 py-1 rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Filter Button */}
          <button className="flex items-center space-x-1 bg-blue-800 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tasks */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Task Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for tasks"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                
                <select className="bg-white border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none">
                  <option>Select preset</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select 
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value)}
                    className="bg-white border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none"
                  >
                    <option value="Created">Created</option>
                    <option value="Priority">Priority</option>
                    <option value="Date">Date</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Asc</span>
                  <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                  </button>
                  <span className="text-xs text-gray-500">Desc</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Selection mode</span>
                <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto">
            {tasks.map((task, index) => (
              <div key={task.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">{task.time}</div>
                    <div className="font-mono text-sm font-medium mb-2">{task.id}</div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-start">
                        <span className="text-blue-600 font-medium mr-1">P</span>
                        <span className="text-gray-700">[{task.pickup.split(',')[0]}] {task.pickup.split(',')[1]?.trim()}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-600 font-medium mr-1">D</span>
                        <span className="text-gray-700">[{task.delivery.split(',')[0]}] {task.delivery.split(',')[1]?.trim()}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <div>{task.value}</div>
                      <div>{task.date}</div>
                      <div>{task.skills}</div>
                      <div className="text-red-600">{task.cost}</div>
                      <div className="text-xs text-gray-500">{task.driver}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'Unviable' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Created
                      </span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Task Summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Showing 198 results of 207 total
              </div>
              
              <div className="text-sm">
                <div className="text-gray-600 mb-2">Filter by status:</div>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs">198 Assigned</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">0 Unassigned</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">9 Unviable</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <button className="text-blue-600 hover:text-blue-800">0 Late tasks</button>
              </div>
            </div>
          </div>
        </div>

        {/* Central Map Area */}
        <div className="flex-1 relative bg-blue-900">
          {/* Video Overlay */}
          {showVideo && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
              <button 
                onClick={() => setShowVideo(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-8 transition-all"
              >
                <Play className="w-16 h-16 text-white" />
              </button>
            </div>
          )}

          {/* Map Content */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-900">
            {/* Simulated Map */}
            <div className="relative w-full h-full">
              {/* Route Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <line x1="100" y1="200" x2="300" y2="150" stroke="#10B981" strokeWidth="3" strokeDasharray="5,5"/>
                <line x1="200" y1="300" x2="400" y2="200" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="5,5"/>
                <line x1="150" y1="400" x2="350" y2="300" stroke="#EF4444" strokeWidth="3" strokeDasharray="5,5"/>
              </svg>

              {/* Map Markers */}
              <div className="absolute top-20 left-32 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                52
              </div>
              <div className="absolute top-32 left-48 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                68
              </div>
              <div className="absolute top-40 left-24 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                44
              </div>
              <div className="absolute top-60 left-40 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                17
              </div>

              {/* Task Highlight */}
              <div className="absolute top-40 left-60 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>

              {/* Task Popup */}
              <div className="absolute top-32 left-80 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <div className="text-sm">
                  <div className="font-mono font-medium mb-1">-T-2JIYFMJN</div>
                  <div className="text-gray-600 mb-2">F3 Architecture & Design Lip, Suite 4, 5 Rochester Mews, London, United Kingdom, NW1 9JB</div>
                  <div className="text-xs text-gray-500 mb-1">Planned: @Thu, Nov 2 | 12:51</div>
                  <div className="text-xs text-gray-500">Box: 30</div>
                </div>
              </div>
            </div>

            {/* Reoptimize Button */}
            <div className="absolute bottom-4 left-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>REOPTIMIZE tomorrow</span>
              </button>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
              <button className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded flex items-center justify-center text-white">
                <Plus className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded flex items-center justify-center text-white">
                <Minus className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded flex items-center justify-center text-white">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Drivers */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Driver Search Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for drivers/vehicles/routes"
                  value={driverSearchQuery}
                  onChange={(e) => setDriverSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                
                <select className="bg-white border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none">
                  <option>Select preset</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select 
                    value={driverSortBy}
                    onChange={(e) => setDriverSortBy(e.target.value)}
                    className="bg-white border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none"
                  >
                    <option value="First name">First name</option>
                    <option value="Last name">Last name</option>
                    <option value="Vehicle">Vehicle</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Asc</span>
                  <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                  </button>
                  <span className="text-xs text-gray-500">Desc</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Selection mode</span>
                <button className="w-8 h-4 bg-gray-300 rounded-full relative">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Driver List */}
          <div className="flex-1 overflow-y-auto">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="space-y-2">
                  <div className="font-mono text-sm font-medium">{driver.id}</div>
                  <div className="text-sm font-medium">{driver.name} {driver.vehicle}</div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Load:</span>
                    <span className="text-xs">{driver.load}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(parseInt(driver.load.split('/')[0]) / parseInt(driver.load.split('/')[1])) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {driver.utilization.map((util, idx) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded ${
                        util >= 90 ? 'bg-green-100 text-green-800' : 
                        util >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {util}%
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{driver.distance}</div>
                    <div>{driver.hours}</div>
                    <div>{driver.cost}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium">{driver.speed}</span>
                      <span className="text-blue-600">{driver.team}</span>
                    </div>
                    {driver.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {driver.skills.map((skill, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Driver Summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Showing 10 results of 10 total
              </div>
              
              <div className="flex space-x-2">
                <button className="text-sm text-blue-600 hover:text-blue-800">Exports</button>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Recurring routes</span>
                  <button className="w-6 h-3 bg-gray-300 rounded-full relative">
                    <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                  </button>
                </div>
              </div>

              <div className="text-sm">
                <div className="text-gray-600 mb-2">Filter by status:</div>
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs">10 Assigned</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">0 Unassigned</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">0 Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline Panel */}
      <div className="bg-blue-900 border-t border-blue-800">
        <div className="p-4">
          {/* Tabs */}
          <div className="flex space-x-4 mb-4">
            <button 
              onClick={() => setActiveTab('drivers')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'drivers' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Drivers
            </button>
            <button 
              onClick={() => setActiveTab('routes')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'routes' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              Routes
            </button>
          </div>

          {/* Driver Schedule Table */}
          <div className="bg-blue-800 rounded-lg p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-white font-medium">Driver</div>
              <div className="col-span-2 text-white font-medium">Load</div>
              <div className="col-span-7 text-white font-medium">Time</div>
            </div>

            {driverSchedules.map((schedule, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center mt-4">
                <div className="col-span-3 text-blue-200">{schedule.name}</div>
                <div className="col-span-2">
                  <div className={`text-sm font-medium ${
                    schedule.load >= 90 ? 'text-green-400' : 
                    schedule.load >= 70 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {schedule.load}%
                  </div>
                </div>
                <div className="col-span-7">
                  <div className="flex space-x-1">
                    {schedule.tasks.map((task, taskIndex) => (
                      <div 
                        key={taskIndex}
                        className="h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-medium min-w-8"
                      >
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics */}
          <div className="mt-4 flex justify-between text-sm text-blue-200">
            <span>Routes: 10</span>
            <span>Total length: 886.80 km</span>
            <span>Total duration: 83:10h</span>
            <span>Tasks/h: 4.68</span>
            <span>Avg. vehicle load: 93%</span>
            <span>Avg. driver util: 92%</span>
          </div>
        </div>
      </div>
    </div>
  );
}