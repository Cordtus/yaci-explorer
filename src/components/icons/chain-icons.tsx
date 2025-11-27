/**
 * Custom chain-related icons for the block explorer
 * These icons complement lucide-react for chain-specific branding
 */

interface IconProps {
  className?: string
}

export const EthereumIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 256 417"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M127.961 0L125.343 9.066v283.296l2.618 2.617 127.962-75.638L127.961 0z" fill="currentColor"/>
    <path d="M127.961 0L0 219.341l127.961 75.638V157.724L127.961 0z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M127.961 312.187L126.386 314.154v98.29l1.575 4.6L256 236.587l-128.039 75.6z" fill="currentColor"/>
    <path d="M127.961 417.044v-104.857L0 236.587l127.961 180.457z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M127.961 295.979l127.962-76.638-127.962-58.022v134.66z" fill="currentColor" fillOpacity="0.45"/>
    <path d="M0 219.341l127.961 76.638V161.319L0 219.341z" fill="currentColor" fillOpacity="0.45"/>
  </svg>
)

export const CosmosIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 102 100"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M63.4122 29.4633L30.4746 61.7665C30.0498 60.9583 29.6666 60.1161 29.323 59.2428C28.1727 56.3076 27.5976 53.1936 27.5976 49.9048C27.5976 46.6132 28.1727 43.5002 29.323 40.5653C30.4746 37.629 32.0697 35.0816 34.1092 32.9193C36.1486 30.7585 38.5998 29.0494 41.4608 27.7908C44.3233 26.5335 47.4639 25.9041 50.884 25.9041C54.3056 25.9041 57.4636 26.5491 60.3567 27.8404C61.4322 28.3196 62.4507 28.8601 63.4122 29.4633ZM60.5055 72.2104C57.6434 73.469 54.5025 74.0971 51.0824 74.0971C47.6608 74.0971 44.5031 73.4522 41.6086 72.1621C40.5342 71.6816 39.5157 71.1412 38.556 70.5366L71.4921 38.2362C71.9166 39.043 72.3001 39.8837 72.6434 40.7584C73.7937 43.6936 74.3692 46.8076 74.3692 50.0978C74.3692 53.3881 73.7937 56.501 72.6434 59.4373C71.4921 62.3722 69.897 64.9196 67.8572 67.0806C65.8177 69.2415 63.368 70.9517 60.5055 72.2104ZM65.489 82.2262C69.897 80.3551 73.7125 77.8235 76.9357 74.6284C80.1589 71.4361 82.6577 67.7097 84.4341 63.4522C86.2111 59.1946 87.0992 54.6782 87.0992 49.9048C87.0992 45.13 86.2111 40.6136 84.4341 36.3546C83.3807 33.8296 82.084 31.4976 80.5449 29.3576L101.968 8.34836L93.4552 0L71.9671 21.0732C70.0381 19.7833 67.9437 18.6682 65.686 17.7268C61.278 15.8885 56.4106 14.968 51.0824 14.968C45.7531 14.968 40.8857 15.9042 36.4777 17.7752C32.0697 19.6462 28.2539 22.1778 25.0307 25.3715C21.8075 28.5651 19.3072 32.2915 17.5312 36.5491C15.7553 40.807 14.8671 45.323 14.8671 50.0978C14.8671 54.8713 15.7553 59.3862 17.5312 63.6456C18.5857 66.172 19.8823 68.5036 21.4214 70.645L0 91.6517L8.5126 100L29.9992 78.9279C31.9283 80.2181 34.0226 81.333 36.2804 82.2744C40.6888 84.113 45.5562 85.032 50.884 85.032C56.2133 85.032 61.0807 84.0958 65.489 82.2262Z"
      fill="currentColor"
    />
  </svg>
)

export const IBCIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 338 202"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_ibc)">
      <path d="M25.9685 3.75977H0V198.467H25.9685V3.75977Z" fill="currentColor" />
      <path d="M122.642 127.439H109.271C81.6502 127.439 59.1836 105.062 59.1836 77.5506V3.69934H136.028C163.649 3.69934 186.115 26.0767 186.115 53.5878V72.9H160.147V53.5878C160.147 40.3456 149.323 29.5646 136.028 29.5646H85.1521V77.5506C85.1521 90.7928 95.9761 101.574 109.271 101.574H122.642V127.439ZM188.708 148.412V125.174C188.708 97.663 166.241 75.2857 138.62 75.2857H122.642V101.151H138.62C151.915 101.151 162.739 111.932 162.739 125.174V148.412C162.739 161.654 151.915 172.435 138.62 172.435H85.1521V129.13H59.1836V198.301H138.62C166.241 198.301 188.708 175.923 188.708 148.412Z" fill="currentColor" />
      <path d="M277.148 202H272.827C239.279 202 211.977 174.806 211.977 141.391V60.594C211.977 27.179 239.279 -0.0150146 272.827 -0.0150146H277.148C310.696 -0.0150146 337.999 27.179 337.999 60.594H312.03C312.03 41.448 296.386 25.8654 277.163 25.8654H272.843C253.62 25.8654 237.975 41.448 237.975 60.594V141.391C237.975 160.537 253.62 176.12 272.843 176.12H277.163C296.386 176.12 312.03 160.537 312.03 141.391H337.999C337.999 174.806 310.696 202 277.148 202Z" fill="currentColor" />
    </g>
    <defs>
      <clipPath id="clip0_ibc">
        <rect width="338" height="202" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export const GasIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 22h12V2H3v20z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 22h3a2 2 0 002-2v-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 12l-2-2v-2a2 2 0 012-2h0a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 2v4h4V2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ValidatorIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2l-8 3v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const GovernanceIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="17" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 8a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M12 8a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
)

export const StakingIcon = ({ className = '' }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
