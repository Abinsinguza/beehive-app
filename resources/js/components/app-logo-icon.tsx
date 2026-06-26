import type { ImgHTMLAttributes } from 'react';
import beeLogo from '../../images/bee.png';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src={beeLogo} alt="BSADS" {...props} />;
}
