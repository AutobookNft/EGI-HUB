import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { Link } from 'react-router-dom'

// Mock data for when API is not available
const mockAggregations = [
  {
    id: 1,
    name: 'Piana Fiorentina',
    description: 'Aggregazione comuni area fiorentina',
    status: 'active',
    members: [{ id: 1 }, { id: 2 }, { id: 3 }],
    created_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Costa Toscana',
    description: 'Comuni della costa toscana',
    status: 'active',
    members: [{ id: 4 }, { id: 5 }],
    created_at: '2025-11-20T14:30:00Z',
  },
]

export default function Aggregations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['aggregations'],
    queryFn: () => api.get('/superadmin/aggregations').then(res => res.data),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-egi-primary"></div>
      </div>
    )
  }

  // Use API data or fallback to mock
  const aggregations = data?.data?.data || mockAggregations
  const isUsingMock = !!error

  return (
    <div className="space-y-6">
      {/* Mock Data Warning */}
      {isUsingMock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <p className="text-yellow-700 text-sm">
            API not available. Showing demo data.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aggregations</h1>
          <p className="text-gray-600">P2P federations between tenants</p>
        </div>
        <button className="px-4 py-2 bg-egi-primary text-white rounded-lg hover:bg-indigo-700 transition">
          + New Aggregation
        </button>
      </div>

      {/* Aggregations List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {aggregations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No aggregations yet. Create one to get started.
                </td>
              </tr>
            ) : (
              aggregations.map((agg: any) => (
                <tr key={agg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{agg.name}</div>
                    <div className="text-sm text-gray-500">{agg.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {agg.members?.length || 0} members
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      agg.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {agg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(agg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link 
                      to={`/aggregations/${agg.id}`}
                      className="text-egi-primary hover:text-indigo-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
