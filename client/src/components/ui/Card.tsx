interface CardProps {
  title: string;
  value: number | string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  icon?: React.ReactNode;
}

const colorMap: Record<NonNullable<CardProps['color']>, string> = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  red: 'text-red-600 bg-red-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  gray: 'text-gray-600 bg-gray-50',
};

export default function Card({ title, value, color = 'gray', icon }: CardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm flex items-center gap-4">
      {icon && (
        <div className={`p-3 rounded-full ${colorMap[color]}`}>{icon}</div>
      )}
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${colorMap[color].split(' ')[0]}`}>{value}</p>
      </div>
    </div>
  );
}
