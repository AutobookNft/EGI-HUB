interface ComingSoonProps {
  title: string
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">
          This module is coming soon. Currently being migrated from EGI.
        </p>
        <div className="mt-6 inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
          <span className="mr-2">📋</span>
          Check SUPERADMIN_MIGRATION_PLAN.md for progress
        </div>
      </div>
    </div>
  )
}
