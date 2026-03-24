import Conf from 'conf'

interface LvtConfig {
    apiUrl: string
    token: string | null
    format: 'table' | 'json' | 'minimal'
}

const config = new Conf<LvtConfig>({
    projectName: 'lvt-cli',
    defaults: {
        apiUrl: 'https://lvtspace.me',
        token: null,
        format: 'table',
    },
})

export default config
