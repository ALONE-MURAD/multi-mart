import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt, Smartphone, Tv, Watch, Sofa, Package, Headphones } from 'lucide-react';
import { useI18n } from '../../shared/contexts/I18nContext';
import { SafeImage } from '../../shared/components/SafeImage';
import type { Category } from '../../shared/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shirt,
  Smartphone,
  Tv,
  Watch,
  Sofa,
  Package,
  Headphones,
};

export const CategoryStrip: React.FC<{ categories: Category[] }> = ({ categories }) => {
  const { pickText } = useI18n();

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No categories published yet. Add categories in the Admin Console to organize your catalog.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.iconName || 'Package'] ?? Package;
        return (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            {cat.imageUrl ? (
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                <SafeImage src={cat.imageUrl} alt={pickText(cat.nameEn, cat.nameBn)} />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <span className="mt-3 text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-emerald-700 line-clamp-1">
              {pickText(cat.nameEn, cat.nameBn)}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
