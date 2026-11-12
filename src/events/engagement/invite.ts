// This event's text for the side being viewed (/engagement, /engagement/aarusha, /engagement/ashlesh).
import { route } from '../../route'
import { invite as resolveInvite } from '../index'
import { engagement } from './content'

export const invite = resolveInvite(engagement, route?.side ?? 'both')
