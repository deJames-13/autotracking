import { AmkorLogoImage } from './app-logo-icon';

export default function AppLogo() {
    return (
        <div className="ml-1 grid flex-1 rounded p-2 text-left text-sm">
            <span className="mb-0.5 truncate leading-none font-semibold">
                <AmkorLogoImage />
            </span>
        </div>
    );
}
