// This event's text for the side being viewed: the wedding's, or on /reception the reception's (same pages).
import { route } from '../../route'
import { invite as resolveInvite } from '../index'
import { reception } from '../reception/content'
import { wedding } from './content'

export const invite = resolveInvite(route?.event === 'reception' ? reception : wedding, route?.side ?? 'both')
