import { AmkorLogoImage } from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="p-2 rounded ml-1 grid flex-1 text-left text-sm">
            <span className="mb-0.5 truncate leading-none font-semibold">
                <AmkorLogoImage />
            </span>
        </div>
    );
}
