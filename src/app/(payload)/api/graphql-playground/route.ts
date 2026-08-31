/* ВНИМАНИЕ: този файл е част от инсталацията на Payload. Не го променяйте ръчно. */
import config from '@payload-config'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
