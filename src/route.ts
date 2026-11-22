// Which event and side this URL is (see src/events/index.ts); null on the bare domain or unknown paths.
// (A sent link moved to another side, in the guest sheet's Sent links tab, opens that card: src/envelope/saved.ts.)
import { fromPath } from './events'

export const route = fromPath(location.pathname)
