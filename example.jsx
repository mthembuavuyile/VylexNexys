import React, { useState } from 'react';
import { 
  Search,
  Folder,
  FileText,
  Grid,
  List,
  ChevronRight,
  ArrowUpRight,
  Settings
} from 'lucide-react';

const FileExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  
  // Sample data - in real app this would come from props or API
  const files = [
    { 
      id: 1,
      name: 'Introduction to Computers',
      type: 'document',
      size: '10.2 KB',
      lastModified: '2024-02-15',
      path: '/documents/tech/'
    },
    {
      id: 2,
      name: 'Programming Concepts',
      type: 'document',
      size: '6.7 KB',
      lastModified: '2024-02-15',
      path: '/documents/tech/'
    },
    {
      id: 3,
      name: 'Course Materials',
      type: 'folder',
      items: 6,
      lastModified: '2024-02-14',
      path: '/documents/'
    }
  ];

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return new Date(b.lastModified) - new Date(a.lastModified);
    return 0;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Documents</span>
          <ChevronRight size={16} />
          <span>Tech</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Name</option>
          <option value="date">Date Modified</option>
        </select>
      </div>

      {/* File Grid/List */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}`}>
        {sortedFiles.map(file => (
          <div
            key={file.id}
            className={`
              ${viewMode === 'grid' 
                ? 'p-4 border rounded-lg hover:shadow-md transition-shadow' 
                : 'p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between'
              }
            `}
          >
            <div className={`flex items-center ${viewMode === 'grid' ? 'mb-3' : ''}`}>
              {file.type === 'folder' 
                ? <Folder className="text-blue-500 mr-3" size={24} />
                : <FileText className="text-gray-500 mr-3" size={24} />
              }
              <div>
                <h3 className="font-medium text-gray-900">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {file.type === 'folder' 
                    ? `${file.items} items` 
                    : file.size
                  }
                </p>
              </div>
            </div>
            {viewMode === 'grid' && (
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>{file.lastModified}</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )}
            {viewMode === 'list' && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{file.lastModified}</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
