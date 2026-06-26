import beeLogo from '../../images/bee.png';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-orange-500 shadow-sm">
                <img src={beeLogo} alt="BSADS" className="size-4 object-contain" />
            </div>
            <div className="grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold tracking-tight text-sidebar-foreground">
                    BSADS
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/50 leading-tight">
                    Beekeeping System
                </span>
            </div>
        </div>
    );
}
