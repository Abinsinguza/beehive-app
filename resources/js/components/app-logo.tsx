import BeeLogoIcon from '@/components/bee-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                <BeeLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-bold tracking-tight text-sidebar-foreground">
                    BSADS
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/50 leading-tight">
                    Beekeeping System
                </span>
            </div>
        </>
    );
}
