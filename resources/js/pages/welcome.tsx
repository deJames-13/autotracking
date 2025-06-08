import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="AutoTracking System">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div
                className="relative flex min-h-screen flex-col items-center p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]"
                // style={{
                //     backgroundImage: `url(${bg_display})`,
                //     backgroundSize: 'cover',
                //     backgroundPosition: 'center',
                //     backgroundRepeat: 'no-repeat',
                //     backgroundColor: '#FDFDFC'
                // }}
            >
                {/* Overlay with blur and color blend */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundColor: 'hsl(var(--primary) / 0.1)',
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                    }}
                />

                <header className="relative z-10 mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="border-border text-foreground hover:border-border/80 dark:border-border dark:text-foreground dark:hover:border-border/80 inline-block rounded-sm border px-5 py-1.5 text-sm leading-normal"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 inline-block rounded-sm border px-5 py-1.5 text-sm leading-normal font-bold uppercase"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('admin.login')}
                                    className="border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/60 inline-block rounded-sm border px-5 py-1.5 text-sm leading-normal uppercase"
                                >
                                    Admin
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="welcome card relative z-10 flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="bg-card dark:bg-card dark:text-card-foreground flex-1 rounded-br-lg rounded-bl-lg p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <h1 className="text-card-foreground mb-1 font-medium">Welcome to AutoTracking</h1>
                            <p className="text-muted-foreground mb-2">
                                Intelligent tracking and monitoring system.
                                <br />
                                Get started with automated tracking solutions.
                            </p>
                            <ul className="mb-4 flex flex-col lg:mb-6">
                                <li className="before:border-border dark:before:border-border relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l">
                                    <span className="bg-card dark:bg-card relative py-1">
                                        <span className="border-border bg-background dark:border-border dark:bg-background flex h-3.5 w-3.5 items-center justify-center rounded-full border shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)]">
                                            <span className="bg-muted dark:bg-muted h-1.5 w-1.5 rounded-full" />
                                        </span>
                                    </span>
                                    <span>
                                        Explore the
                                        <a
                                            href="/dashboard"
                                            className="text-primary dark:text-primary ml-1 inline-flex items-center space-x-1 font-medium underline underline-offset-4"
                                        >
                                            <span>Dashboard</span>
                                            <svg
                                                width={10}
                                                height={11}
                                                viewBox="0 0 10 11"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-2.5 w-2.5"
                                            >
                                                <path
                                                    d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                                                    stroke="currentColor"
                                                    strokeLinecap="square"
                                                />
                                            </svg>
                                        </a>
                                    </span>
                                </li>
                                <li className="before:border-border dark:before:border-border relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-1/2 before:left-[0.4rem] before:border-l">
                                    <span className="bg-card dark:bg-card relative py-1">
                                        <span className="border-border bg-background dark:border-border dark:bg-background flex h-3.5 w-3.5 items-center justify-center rounded-full border shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)]">
                                            <span className="bg-muted dark:bg-muted h-1.5 w-1.5 rounded-full" />
                                        </span>
                                    </span>
                                    <span>
                                        View
                                        <a
                                            href="https://amkor.com/"
                                            className="text-primary dark:text-primary ml-1 inline-flex items-center space-x-1 font-medium underline underline-offset-4"
                                        >
                                            <span>Website</span>
                                            <svg
                                                width={10}
                                                height={11}
                                                viewBox="0 0 10 11"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-2.5 w-2.5"
                                            >
                                                <path
                                                    d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                                                    stroke="currentColor"
                                                    strokeLinecap="square"
                                                />
                                            </svg>
                                        </a>
                                    </span>
                                </li>
                            </ul>
                            <ul className="flex gap-3 text-sm leading-normal">
                                <li>
                                    <a
                                        href={route('dashboard')}
                                        className="border-primary bg-primary text-primary-foreground hover:bg-primary/90 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 inline-block rounded-sm border px-5 py-1.5 text-sm leading-normal"
                                    >
                                        Get Started
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="relative -mb-px aspect-[335/376] w-full shrink-0 overflow-hidden rounded-t-lg bg-[#fff2f2] lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:bg-[#1D0002]">
                            <svg
                                className="text-primary dark:text-primary w-full max-w-none translate-y-0 opacity-100 transition-all duration-750 starting:translate-y-6 starting:opacity-0"
                                viewBox="0 0 438 104"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M60 20H20V84H60V20Z" fill="currentColor" />
                                <path d="M80 35H100V69H80V35Z" fill="currentColor" />
                                <path d="M120 25H140V79H120V25Z" fill="currentColor" />
                                <path d="M160 40H180V64H160V40Z" fill="currentColor" />
                                <path d="M200 15H220V89H200V15Z" fill="currentColor" />
                                <path d="M240 30H260V74H240V30Z" fill="currentColor" />
                                <path d="M280 22H300V82H280V22Z" fill="currentColor" />
                                <path d="M320 38H340V66H320V38Z" fill="currentColor" />
                                <path d="M360 28H380V76H360V28Z" fill="currentColor" />
                                <path d="M400 18H420V86H400V18Z" fill="currentColor" />

                                {/* Connecting line */}
                                <path
                                    d="M30 30L90 45L130 35L170 50L210 25L250 40L290 32L330 48L370 38L410 28"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            </svg>
                            <svg
                                className="relative -mt-[4.9rem] -ml-8 w-[448px] max-w-none lg:-mt-[6.6rem] lg:ml-0 dark:hidden"
                                viewBox="0 0 440 376"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0">
                                    <path
                                        d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z"
                                        fill="black"
                                    />
                                    <path
                                        d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z"
                                        fill="#391800"
                                    />
                                    <path
                                        d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z"
                                        fill="#391800"
                                    />
                                    <path
                                        d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                </g>
                                <g
                                    /** @ts-expect-error 'plus-darker' doesn't seem to be defined in the 'csstype' module */
                                    style={{ mixBlendMode: 'plus-darker' }}
                                    className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0"
                                >
                                    <path
                                        d="M230.951 281.792L231.282 281.793C238.128 274.907 248.453 265.823 262.256 254.539C275.617 243.256 285.666 234.267 292.402 227.573C299.027 220.688 303.554 213.421 305.983 205.771C308.412 198.12 307.253 190.183 302.504 181.959C297.203 172.778 289.749 165.415 280.142 159.868C270.645 154.13 260.596 151.26 249.995 151.26C239.615 151.26 232.823 154.033 229.621 159.579C226.309 164.934 227.413 172.393 232.935 181.956L168.335 181.954C159.058 165.888 155.082 151.543 156.407 138.92C157.953 126.298 164.247 116.544 175.289 109.659C186.442 102.583 201.294 99.045 219.846 99.0457C239.281 99.0464 258.551 102.585 277.655 109.663C296.649 116.549 313.986 126.303 329.667 138.927C345.349 151.551 357.827 165.895 367.104 181.961C375.718 196.88 379.528 209.981 378.535 221.265C377.762 232.549 374.063 242.399 367.438 250.814C361.033 259.229 351.095 269.557 337.624 281.796L419.782 281.8L448.605 331.719L259.774 331.712L230.951 281.792Z"
                                        fill="#F3BEC7"
                                    />
                                    <path
                                        d="M51.8063 152.402L28.9479 152.401L-0.0411453 102.195L85.7608 102.198L218.282 331.711L155.339 331.709L51.8063 152.402Z"
                                        fill="#F3BEC7"
                                    />
                                    <path
                                        d="M230.951 281.792L231.282 281.793C238.128 274.907 248.453 265.823 262.256 254.539C275.617 243.256 285.666 234.267 292.402 227.573C299.027 220.688 303.554 213.421 305.983 205.771C308.412 198.12 307.253 190.183 302.504 181.959C297.203 172.778 289.749 165.415 280.142 159.868C270.645 154.13 260.596 151.26 249.995 151.26C239.615 151.26 232.823 154.033 229.621 159.579C226.309 164.934 227.413 172.393 232.935 181.956L168.335 181.954C159.058 165.888 155.082 151.543 156.407 138.92C157.953 126.298 164.247 116.544 175.289 109.659C186.442 102.583 201.294 99.045 219.846 99.0457C239.281 99.0464 258.551 102.585 277.655 109.663C296.649 116.549 313.986 126.303 329.667 138.927C345.349 151.551 357.827 165.895 367.104 181.961C375.718 196.88 379.528 209.981 378.535 221.265C377.762 232.549 374.063 242.399 367.438 250.814C361.033 259.229 351.095 269.557 337.624 281.796L419.782 281.8L448.605 331.719L259.774 331.712L230.951 281.792Z"
                                        stroke="#1B1B18"
                                        strokeWidth={1}
                                    />
                                    <path
                                        d="M51.8063 152.402L28.9479 152.401L-0.0411453 102.195L85.7608 102.198L218.282 331.711L155.339 331.709L51.8063 152.402Z"
                                        stroke="#1B1B18"
                                        strokeWidth={1}
                                    />
                                </g>
                                <g className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0">
                                    <path
                                        d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z"
                                        fill="#4B0600"
                                    />
                                    <path
                                        d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                        strokeLinejoin="round"
                                    />
                                </g>
                                <g
                                    className="translate-y-0 opacity-100 transition-all delay-300 duration-750 starting:translate-y-4 starting:opacity-0"
                                    style={{ mixBlendMode: 'hard-light' }}
                                >
                                    <path
                                        d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z"
                                        fill="#4B0600"
                                    />
                                    <path
                                        d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z"
                                        stroke="#FF750F"
                                        strokeWidth={1}
                                    />
                                </g>
                            </svg>
                            <div className="absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]" />
                        </div>
                    </main>
                </div>
                <div className="relative z-10 hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
