import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqtsfhwifwvuqesrpdla.supabase.co'
const supabaseKey = 'sb_publishable_ZGFWP7f3TKOvxPkbyG6_fw_P65ylDts'

export const supabase = createClient(supabaseUrl, supabaseKey)
