// This event's text for the side being viewed (/mehendi, /mehendi/aarusha, /mehendi/ashlesh).
import { route } from '../../route'
import { invite as resolveInvite } from '../index'
import { mehendi } from './content'

export const invite = resolveInvite(mehendi, route?.side ?? 'both')
