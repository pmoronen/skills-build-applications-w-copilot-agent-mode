import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  emptyMessage: string;
  isEmpty: (data: T) => boolean;
  renderData: (data: T) => ReactNode;
};

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T };

export function CapabilityCard<T>({ title, description, path, emptyMessage, isEmpty, renderData }: Props<T>) {
  const [resource, setResource] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    getJson<T>(path)
      .then((data) => {
        if (isCurrent) setResource({ status: 'success', data });
      })
      .catch(() => {
        if (isCurrent) setResource({ status: 'error' });
      });

    return () => {
      isCurrent = false;
    };
  }, [path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {resource.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {resource.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}.</p>}
        {resource.status === 'success' && isEmpty(resource.data) && <p role="status">{emptyMessage}</p>}
        {resource.status === 'success' && !isEmpty(resource.data) && renderData(resource.data)}
      </div>
    </section>
  );
}
