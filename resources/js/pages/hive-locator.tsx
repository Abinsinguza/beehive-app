import { Head } from '@inertiajs/react';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

const mockHives = [
    { id: 'BH0001', location: 'Masaka',  lat: -0.3136, lng: 31.7333, state: 'active',   battery: 12, lastActivity: '2026-04-24' },
    { id: 'BH0002', location: 'Nyendo',  lat: -0.3736, lng: 31.7833, state: 'migrated', battery: 88, lastActivity: '2026-04-26' },
    { id: 'BH0003', location: 'Kampala', lat:  0.3476, lng: 32.5825, state: 'lost',     battery: 95, lastActivity: '2026-05-11' },
];

const stateColorMap: Record<string, string> = {
    active:      '#22c55e',
    migrated:    '#f59e0b',
    lost:        '#ef4444',
    abscondence: '#991b1b',
    pest:        '#f97316',
    uncertain:   '#9ca3af',
};

const stateLabelMap: Record<string, string> = {
    active:      'NORMAL',
    migrated:    'PRE-SWARM',
    lost:        'SWARM',
    abscondence: 'ABSCONDENCE',
    pest:        'PEST/DISTURBANCE',
    uncertain:   'UNCERTAIN',
};

const legend = [
    { color: '#22c55e', label: 'Normal' },
    { color: '#f59e0b', label: 'Pre-Swarm' },
    { color: '#ef4444', label: 'Swarm' },
    { color: '#991b1b', label: 'Abscondence' },
    { color: '#f97316', label: 'Pest/Disturbance' },
    { color: '#9ca3af', label: 'Uncertain' },
];

function HiveLocatorMap() {
    const mapRef         = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        import('leaflet').then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, {
                    zoomControl:      true,
                    scrollWheelZoom:  true,
                    minZoom:          7,
                    maxZoom:          15,
                    maxBounds:        [[-1.4784, 29.5733], [4.2340, 35.0000]],
                    maxBoundsViscosity: 1.0,
                })
                .setView([1.3733, 32.2903], 7);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(map);

            // Inverted polygon: world rectangle with Uganda hole — greys out everything outside Uganda
            const world: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
            const uganda: [number, number][] = [
                [-1.4784, 29.5733], [-1.4784, 35.0000],
                [4.2340,  35.0000], [4.2340,  29.5733],
            ];
            L.polygon([world, uganda], {
                color:       'none',
                fillColor:   '#94a3b8',
                fillOpacity: 0.55,
                interactive: false,
            }).addTo(map);

            mockHives.forEach((hive) => {
                const color = stateColorMap[hive.state] ?? '#94a3b8';
                const label = stateLabelMap[hive.state] ?? hive.state.toUpperCase();
                const batColor = hive.battery <= 20 ? '#ef4444' : hive.battery <= 50 ? '#f59e0b' : '#22c55e';

                const icon = L.divIcon({
                    className: '',
                    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
                    iconSize:   [16, 16],
                    iconAnchor: [8, 8],
                });

                const popup = `
                    <div style="font-family:sans-serif;min-width:180px;padding:4px 0">
                        <p style="font-weight:700;font-size:14px;color:#0d1b2a;margin:0 0 6px">${hive.id}</p>
                        <p style="font-size:12px;color:#64748b;margin:0 0 6px">📍 ${hive.location}</p>
                        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:${color}20;color:${color};text-transform:uppercase">${label}</span>
                        <p style="font-size:12px;color:#64748b;margin:8px 0 3px">🔋 Battery: <strong style="color:${batColor}">${hive.battery}%</strong></p>
                        <p style="font-size:12px;color:#64748b;margin:0 0 8px">📅 Last Activity: ${hive.lastActivity}</p>
                        <a href="/beehives" style="font-size:12px;color:#f5a623;font-weight:600;text-decoration:none">View Details →</a>
                    </div>`;

                L.marker([hive.lat, hive.lng], { icon }).addTo(map).bindPopup(popup);
            });

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={mapRef} style={{ height: '600px', width: '100%' }} />;
}

export default function HiveLocator() {
    return (
        <>
            <Head title="Hive Locator" />
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Hive Locator</h1>
                    <p className="text-sm text-gray-500 mt-1">Geographic overview of all registered hives</p>
                </div>

                {/* Map card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Regional Hive Concentration</h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>Live Feed</span>
                    </div>

                    <HiveLocatorMap />

                    {/* Legend */}
                    <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap gap-5">
                        {legend.map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-xs text-gray-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

HiveLocator.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Hive Locator',    href: '/hive-locator' },
    ],
};
