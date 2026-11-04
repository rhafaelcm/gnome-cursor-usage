import GLib from 'gi://GLib';

// Keep translation selection local to the extension. Changing the process locale
// would also change GNOME Shell and every other enabled extension.
export const LANGUAGE_OPTIONS = [
    {id: 'system', name: 'System default'},
    {id: 'en', name: 'English'},
    {id: 'pt', name: 'Português'},
    {id: 'pt-BR', name: 'Português (Brasil)'},
    {id: 'es', name: 'Español'},
    {id: 'fr', name: 'Français'},
    {id: 'de', name: 'Deutsch'},
];

const PT_BR = {
    'System default': 'Padrão do sistema',
    General: 'Geral',
    Appearance: 'Aparência',
    'The extension follows the GNOME accent color and light or dark style.': 'A extensão acompanha a cor de destaque e o tema claro ou escuro do GNOME.',
    'Show percentage on the panel': 'Mostrar porcentagem no painel',
    'Display the active provider usage next to the icon': 'Exibe o uso do provedor ativo ao lado do ícone',
    Providers: 'Provedores',
    'Show Cursor plan usage': 'Mostrar uso do plano Cursor',
    'Show Claude Code plan usage': 'Mostrar uso do plano Claude Code',
    'Show Codex plan usage': 'Mostrar uso do plano Codex',
    'Default provider': 'Provedor padrão',
    'Shown in the panel and selected when the menu opens': 'Exibido no painel e selecionado ao abrir o menu',
    Updates: 'Atualizações',
    'Refresh interval': 'Intervalo de atualização',
    'Seconds between background updates': 'Segundos entre atualizações em segundo plano',
    Language: 'Idioma',
    'Interface language': 'Idioma da interface',
    'Follow the system language or choose one for this extension': 'Siga o idioma do sistema ou escolha um para esta extensão',
    'Reopen Preferences to update all labels after changing the language.': 'Reabra as Configurações para atualizar todos os textos após trocar o idioma.',
    Reset: 'Redefinir',
    'Restore every extension setting to the defaults. Login files on disk are not deleted.': 'Restaura todas as configurações da extensão. Os arquivos de login não são excluídos.',
    'Reset settings': 'Redefinir configurações',
    'Interval, providers, language, and credential path overrides': 'Intervalo, provedores, idioma e caminhos personalizados de credenciais',
    Accounts: 'Contas',
    Account: 'Conta',
    'Checking…': 'Verificando…',
    'Sign in': 'Entrar',
    'Cursor state database': 'Banco de dados de estado do Cursor',
    'Cursor credentials': 'Credenciais do Cursor',
    'Claude credentials.json': 'credentials.json do Claude',
    'Codex auth.json': 'auth.json do Codex',
    About: 'Sobre',
    Version: 'Versão',
    License: 'Licença',
    Copyright: 'Direitos autorais',
    'Project website': 'Site do projeto',
    Open: 'Abrir',
    'Shows Cursor, Claude Code, and Codex plan usage in the GNOME top bar.': 'Mostra o uso dos planos Cursor, Claude Code e Codex na barra superior do GNOME.',
    Found: 'Encontrado',
    'Not found': 'Não encontrado',
    'No path': 'Sem caminho',
    Custom: 'Personalizado',
    'Default:': 'Padrão:',
    Default: 'Padrão',
    'Reset settings?': 'Redefinir configurações?',
    'Restore the default refresh interval, providers, language, and credential paths. Login files on disk are not deleted.':
        'Restaura o intervalo, os provedores, o idioma e os caminhos de credenciais. Os arquivos de login não são excluídos.',
    Cancel: 'Cancelar',
    'Signed in with the Cursor app': 'Conectado pelo aplicativo Cursor',
    'Signed in with cursor-agent': 'Conectado pelo cursor-agent',
    'Signed in with Claude API': 'Conectado pela API do Claude',
    'Signed in with the Claude Code CLI': 'Conectado pela CLI do Claude Code',
    'Signed in with the Codex CLI': 'Conectado pela CLI do Codex',
    'Not signed in': 'Não conectado',
    Refresh: 'Atualizar',
    'No providers enabled': 'Nenhum provedor habilitado',
    'Turn on Cursor, Claude, or Codex in Preferences.': 'Ative Cursor, Claude ou Codex nas Configurações.',
    'Updating…': 'Atualizando…',
    'Signed in': 'Conectado',
    Usage: 'Uso',
    Settings: 'Configurações',
    Limits: 'Limites',
    'Tokens by day': 'Tokens por dia',
    'Tokens by model': 'Tokens por modelo',
    'Resets in': 'Redefine em',
    soon: 'em breve',
    Auto: 'Automático',
    Today: 'Hoje',
    'Included total': 'Total incluído',
    'Cursor Models': 'Modelos do Cursor',
    'Other Models': 'Outros modelos',
    '5-hour': '5 horas',
    Weekly: 'Semanal',
    'Weekly Opus': 'Opus semanal',
    'Weekly Sonnet': 'Sonnet semanal',
    'Extra usage': 'Uso extra',
    'Sign in to Cursor': 'Entre no Cursor',
    'Sign in to Claude Code': 'Entre no Claude Code',
    'Sign in to Codex': 'Entre no Codex',
    'Cursor limits unavailable': 'Limites do Cursor indisponíveis',
    'Claude limits unavailable': 'Limites do Claude indisponíveis',
    'Codex limits unavailable': 'Limites do Codex indisponíveis',
    'Claude API login': 'Login pela API do Claude',
    'Usage response did not include rate limits.': 'A resposta de uso não incluiu limites.',
    'Usage response did not include plan usage.': 'A resposta não incluiu o uso do plano.',
    'Usage response was not a JSON object.': 'A resposta de uso não era um objeto JSON.',
    'Could not reach Cursor usage API.': 'Não foi possível acessar a API de uso do Cursor.',
    'Could not reach Claude usage API.': 'Não foi possível acessar a API de uso do Claude.',
    'Could not reach Codex usage API.': 'Não foi possível acessar a API de uso do Codex.',
    'Could not reach the usage API': 'Não foi possível acessar a API de uso',
    'Usage API response was too large': 'A resposta da API de uso era muito grande',
    'Could not parse usage response': 'Não foi possível interpretar a resposta de uso',
    'Usage API returned an unexpected redirect': 'A API de uso retornou um redirecionamento inesperado',
    'Usage API rate limited': 'A API de uso limitou as requisições',
    'Session expired': 'Sessão expirada',
    'HTTP client was destroyed': 'O cliente HTTP foi destruído',
    'Invalid request URL': 'URL de requisição inválida',
    'Usage API returned HTTP {status}': 'A API de uso retornou HTTP {status}',
    'Open Cursor and sign in, or run `cursor-agent login`.': 'Abra o Cursor e entre, ou execute `cursor-agent login`.',
    'Install the Claude Code CLI and run `claude login`.': 'Instale a CLI do Claude Code e execute `claude login`.',
    'Install the Codex CLI and run `codex login`.': 'Instale a CLI do Codex e execute `codex login`.',
    'Cursor session expired. Open Cursor and sign in again, or run `cursor-agent login`.': 'A sessão do Cursor expirou. Entre novamente no Cursor ou execute `cursor-agent login`.',
    'Claude session expired. Run `claude login` again.': 'A sessão do Claude expirou. Execute `claude login` novamente.',
    'Codex session expired. Run `codex login` again.': 'A sessão do Codex expirou. Execute `codex login` novamente.',
    'Usage API rate limited. Try again in a few minutes.': 'A API limitou as requisições. Tente novamente em alguns minutos.',
    'This login is API / prepaid. Plan bars (5-hour and weekly) need `claude login` and the Claude.ai Pro/Max option.':
        'Este login é de API ou pré-pago. As barras de 5 horas e semanal exigem `claude login` com Claude.ai Pro/Max.',
    'A browser window should open. Finish signing in with cursor-agent, then return here.': 'Uma janela do navegador será aberta. Conclua o login no cursor-agent e volte aqui.',
    'Sign in inside the Cursor app, then return here.': 'Entre no aplicativo Cursor e volte aqui.',
    'Open Cursor and sign in, or install cursor-agent and run `cursor-agent login`.': 'Abra o Cursor e entre, ou instale o cursor-agent e execute `cursor-agent login`.',
    'A browser window should open. Finish signing in with Codex, then return here.': 'Uma janela do navegador será aberta. Conclua o login no Codex e volte aqui.',
    'Install the Codex CLI and run `codex login`, then return here.': 'Instale a CLI do Codex, execute `codex login` e volte aqui.',
    'A browser window should open. Finish signing in with Claude Code, then return here.': 'Uma janela do navegador será aberta. Conclua o login no Claude Code e volte aqui.',
    'Install the Claude Code CLI and run `claude login`, then return here.': 'Instale a CLI do Claude Code, execute `claude login` e volte aqui.',
    'The extension reads the local Cursor token. Leave a path empty to use the default. Fill it only if Cursor is installed somewhere else.':
        'A extensão lê o token local do Cursor. Deixe o caminho vazio para usar o padrão e preencha apenas se o Cursor estiver em outro local.',
    'The extension reads the local Claude Code token. Leave the path empty to use the default. Fill it only if Claude Code is installed somewhere else.':
        'A extensão lê o token local do Claude Code. Deixe o caminho vazio para usar o padrão e preencha apenas se estiver em outro local.',
    'The extension reads the local Codex token. Leave the path empty to use the default. Fill it only if Codex is installed somewhere else.':
        'A extensão lê o token local do Codex. Deixe o caminho vazio para usar o padrão e preencha apenas se estiver em outro local.',
    'Token from the Cursor app. Default: ~/.config/Cursor/User/globalStorage/state.vscdb. Leave empty to use that path.':
        'Token do aplicativo Cursor. Padrão: ~/.config/Cursor/User/globalStorage/state.vscdb. Deixe em branco para usar esse caminho.',
    'Token from `cursor-agent login`. Default: ~/.config/cursor/auth.json. Leave empty to use that path.':
        'Token de `cursor-agent login`. Padrão: ~/.config/cursor/auth.json. Deixe em branco para usar esse caminho.',
    'Token from the Claude Code CLI. Default: ~/.claude/.credentials.json. Leave empty to use that path.':
        'Token da CLI do Claude Code. Padrão: ~/.claude/.credentials.json. Deixe em branco para usar esse caminho.',
    'Token from the Codex CLI. Default: ~/.codex/auth.json. Leave empty to use that path.':
        'Token da CLI do Codex. Padrão: ~/.codex/auth.json. Deixe em branco para usar esse caminho.',
};

const PT = {
    ...PT_BR,
    'System default': 'Predefinição do sistema',
    'Show percentage on the panel': 'Mostrar percentagem no painel',
    'Display the active provider usage next to the icon': 'Apresenta a utilização do fornecedor ativo junto ao ícone',
    Providers: 'Fornecedores',
    'Default provider': 'Fornecedor predefinido',
    Settings: 'Definições',
    'Turn on Cursor, Claude, or Codex in Preferences.': 'Ative o Cursor, Claude ou Codex nas Definições.',
    'Updating…': 'A atualizar…',
    'Checking…': 'A verificar…',
    'Sign in': 'Iniciar sessão',
    'Signed in': 'Sessão iniciada',
    'Not signed in': 'Sessão não iniciada',
    'Not found': 'Não encontrado',
    'Cursor state database': 'Base de dados de estado do Cursor',
    'Restore every extension setting to the defaults. Login files on disk are not deleted.': 'Repõe todas as definições da extensão. Os ficheiros de início de sessão não são eliminados.',
    'Reset settings': 'Repor definições',
    'Reset settings?': 'Repor definições?',
    'Project website': 'Página do projeto',
    'Tokens by day': 'Tokens por dia',
    'Tokens by model': 'Tokens por modelo',
};

const ES = {
    'System default': 'Predeterminado del sistema', General: 'General', Appearance: 'Apariencia',
    'The extension follows the GNOME accent color and light or dark style.': 'La extensión sigue el color de acento y el estilo claro u oscuro de GNOME.',
    'Show percentage on the panel': 'Mostrar porcentaje en el panel',
    'Display the active provider usage next to the icon': 'Muestra el uso del proveedor activo junto al icono',
    Providers: 'Proveedores', 'Show Cursor plan usage': 'Mostrar el uso del plan de Cursor',
    'Show Claude Code plan usage': 'Mostrar el uso del plan de Claude Code', 'Show Codex plan usage': 'Mostrar el uso del plan de Codex',
    'Default provider': 'Proveedor predeterminado', 'Shown in the panel and selected when the menu opens': 'Se muestra en el panel y se selecciona al abrir el menú',
    Updates: 'Actualizaciones', 'Refresh interval': 'Intervalo de actualización', 'Seconds between background updates': 'Segundos entre actualizaciones en segundo plano',
    Language: 'Idioma', 'Interface language': 'Idioma de la interfaz', 'Follow the system language or choose one for this extension': 'Usa el idioma del sistema o elige uno para esta extensión',
    'Reopen Preferences to update all labels after changing the language.': 'Vuelve a abrir Preferencias para actualizar todos los textos después de cambiar el idioma.',
    Reset: 'Restablecer', 'Restore every extension setting to the defaults. Login files on disk are not deleted.': 'Restaura todos los ajustes. Los archivos de inicio de sesión no se eliminan.',
    'Reset settings': 'Restablecer ajustes', 'Interval, providers, language, and credential path overrides': 'Intervalo, proveedores, idioma y rutas personalizadas de credenciales',
    Accounts: 'Cuentas', Account: 'Cuenta', 'Checking…': 'Comprobando…', 'Sign in': 'Iniciar sesión',
    'Cursor state database': 'Base de datos de estado de Cursor', 'Claude credentials.json': 'credentials.json de Claude', 'Codex auth.json': 'auth.json de Codex',
    About: 'Acerca de', Version: 'Versión', License: 'Licencia', Copyright: 'Derechos de autor', 'Project website': 'Sitio del proyecto', Open: 'Abrir',
    'Shows Cursor, Claude Code, and Codex plan usage in the GNOME top bar.': 'Muestra el uso de los planes Cursor, Claude Code y Codex en la barra superior de GNOME.',
    Found: 'Encontrado', 'Not found': 'No encontrado', 'No path': 'Sin ruta', Custom: 'Personalizado', 'Default:': 'Predeterminado:', Default: 'Predeterminado',
    'Reset settings?': '¿Restablecer ajustes?',
    'Restore the default refresh interval, providers, language, and credential paths. Login files on disk are not deleted.':
        'Restaura el intervalo, los proveedores, el idioma y las rutas de credenciales. Los archivos de inicio de sesión no se eliminan.',
    Cancel: 'Cancelar', 'Signed in with the Cursor app': 'Sesión iniciada con la aplicación Cursor', 'Signed in with cursor-agent': 'Sesión iniciada con cursor-agent',
    'Signed in with Claude API': 'Sesión iniciada con la API de Claude', 'Signed in with the Claude Code CLI': 'Sesión iniciada con la CLI de Claude Code',
    'Signed in with the Codex CLI': 'Sesión iniciada con la CLI de Codex', 'Not signed in': 'Sesión no iniciada', Refresh: 'Actualizar',
    'No providers enabled': 'No hay proveedores habilitados', 'Turn on Cursor, Claude, or Codex in Preferences.': 'Activa Cursor, Claude o Codex en Preferencias.',
    'Updating…': 'Actualizando…', 'Signed in': 'Sesión iniciada', Usage: 'Uso', Settings: 'Preferencias', Limits: 'Límites',
    'Tokens by day': 'Tokens por día', 'Tokens by model': 'Tokens por modelo', 'Resets in': 'Se restablece en', Auto: 'Automático', Today: 'Hoy',
    soon: 'pronto',
    'Included total': 'Total incluido', 'Cursor Models': 'Modelos de Cursor', 'Other Models': 'Otros modelos', '5-hour': '5 horas', Weekly: 'Semanal',
    'Weekly Opus': 'Opus semanal', 'Weekly Sonnet': 'Sonnet semanal', 'Extra usage': 'Uso adicional',
    'Sign in to Cursor': 'Inicia sesión en Cursor', 'Sign in to Claude Code': 'Inicia sesión en Claude Code', 'Sign in to Codex': 'Inicia sesión en Codex',
    'Cursor limits unavailable': 'Límites de Cursor no disponibles', 'Claude limits unavailable': 'Límites de Claude no disponibles', 'Codex limits unavailable': 'Límites de Codex no disponibles',
    'Claude API login': 'Inicio de sesión con la API de Claude', 'Usage response did not include rate limits.': 'La respuesta no incluyó límites de uso.',
    'Usage response did not include plan usage.': 'La respuesta no incluyó el uso del plan.', 'Usage response was not a JSON object.': 'La respuesta de uso no era un objeto JSON.',
    'Could not reach Cursor usage API.': 'No se pudo acceder a la API de uso de Cursor.', 'Could not reach Claude usage API.': 'No se pudo acceder a la API de uso de Claude.',
    'Could not reach Codex usage API.': 'No se pudo acceder a la API de uso de Codex.', 'Could not reach the usage API': 'No se pudo acceder a la API de uso',
    'Usage API response was too large': 'La respuesta de la API era demasiado grande', 'Could not parse usage response': 'No se pudo interpretar la respuesta de uso',
    'Usage API returned an unexpected redirect': 'La API devolvió una redirección inesperada', 'Usage API rate limited': 'La API limitó las solicitudes',
    'Session expired': 'La sesión ha caducado', 'HTTP client was destroyed': 'El cliente HTTP fue destruido', 'Invalid request URL': 'URL de solicitud no válida',
    'Usage API returned HTTP {status}': 'La API de uso devolvió HTTP {status}',
    'Open Cursor and sign in, or run `cursor-agent login`.': 'Abre Cursor e inicia sesión, o ejecuta `cursor-agent login`.',
    'Install the Claude Code CLI and run `claude login`.': 'Instala la CLI de Claude Code y ejecuta `claude login`.',
    'Install the Codex CLI and run `codex login`.': 'Instala la CLI de Codex y ejecuta `codex login`.',
    'Cursor session expired. Open Cursor and sign in again, or run `cursor-agent login`.':
        'La sesión de Cursor ha caducado. Inicia sesión de nuevo o ejecuta `cursor-agent login`.',
    'Claude session expired. Run `claude login` again.': 'La sesión de Claude ha caducado. Ejecuta `claude login` de nuevo.',
    'Codex session expired. Run `codex login` again.': 'La sesión de Codex ha caducado. Ejecuta `codex login` de nuevo.',
    'Usage API rate limited. Try again in a few minutes.': 'La API limitó las solicitudes. Inténtalo de nuevo en unos minutos.',
    'This login is API / prepaid. Plan bars (5-hour and weekly) need `claude login` and the Claude.ai Pro/Max option.':
        'Este acceso es de API o prepago. Las barras de 5 horas y semanal requieren `claude login` con Claude.ai Pro/Max.',
    'A browser window should open. Finish signing in with cursor-agent, then return here.':
        'Se abrirá una ventana del navegador. Completa el acceso con cursor-agent y vuelve aquí.',
    'Sign in inside the Cursor app, then return here.': 'Inicia sesión en la aplicación Cursor y vuelve aquí.',
    'Open Cursor and sign in, or install cursor-agent and run `cursor-agent login`.':
        'Abre Cursor e inicia sesión, o instala cursor-agent y ejecuta `cursor-agent login`.',
    'A browser window should open. Finish signing in with Codex, then return here.':
        'Se abrirá una ventana del navegador. Completa el acceso con Codex y vuelve aquí.',
    'Install the Codex CLI and run `codex login`, then return here.':
        'Instala la CLI de Codex, ejecuta `codex login` y vuelve aquí.',
    'A browser window should open. Finish signing in with Claude Code, then return here.':
        'Se abrirá una ventana del navegador. Completa el acceso con Claude Code y vuelve aquí.',
    'Install the Claude Code CLI and run `claude login`, then return here.':
        'Instala la CLI de Claude Code, ejecuta `claude login` y vuelve aquí.',
    'The extension reads the local Cursor token. Leave a path empty to use the default. Fill it only if Cursor is installed somewhere else.':
        'La extensión lee el token local de Cursor. Deja la ruta vacía para usar la predeterminada; complétala solo si Cursor está en otro lugar.',
    'The extension reads the local Claude Code token. Leave the path empty to use the default. Fill it only if Claude Code is installed somewhere else.':
        'La extensión lee el token local de Claude Code. Deja la ruta vacía para usar la predeterminada; complétala solo si está en otro lugar.',
    'The extension reads the local Codex token. Leave the path empty to use the default. Fill it only if Codex is installed somewhere else.':
        'La extensión lee el token local de Codex. Deja la ruta vacía para usar la predeterminada; complétala solo si Codex está en otro lugar.',
    'Token from the Cursor app. Default: ~/.config/Cursor/User/globalStorage/state.vscdb. Leave empty to use that path.':
        'Token de la aplicación Cursor. Predeterminado: ~/.config/Cursor/User/globalStorage/state.vscdb. Déjalo vacío para usar esa ruta.',
    'Token from `cursor-agent login`. Default: ~/.config/cursor/auth.json. Leave empty to use that path.':
        'Token de `cursor-agent login`. Predeterminado: ~/.config/cursor/auth.json. Déjalo vacío para usar esa ruta.',
    'Token from the Claude Code CLI. Default: ~/.claude/.credentials.json. Leave empty to use that path.':
        'Token de la CLI de Claude Code. Predeterminado: ~/.claude/.credentials.json. Déjalo vacío para usar esa ruta.',
    'Token from the Codex CLI. Default: ~/.codex/auth.json. Leave empty to use that path.':
        'Token de la CLI de Codex. Predeterminado: ~/.codex/auth.json. Déjalo vacío para usar esa ruta.',
};

const FR = {
    'System default': 'Langue du système', General: 'Général', Appearance: 'Apparence',
    'The extension follows the GNOME accent color and light or dark style.': "L’extension suit la couleur d’accentuation et le thème clair ou sombre de GNOME.",
    'Show percentage on the panel': 'Afficher le pourcentage dans le panneau', 'Display the active provider usage next to the icon': "Affiche l’utilisation du fournisseur actif près de l’icône",
    Providers: 'Fournisseurs', 'Show Cursor plan usage': "Afficher l’utilisation du forfait Cursor", 'Show Claude Code plan usage': "Afficher l’utilisation du forfait Claude Code",
    'Show Codex plan usage': "Afficher l’utilisation du forfait Codex", 'Default provider': 'Fournisseur par défaut',
    'Shown in the panel and selected when the menu opens': "Affiché dans le panneau et sélectionné à l’ouverture du menu", Updates: 'Mises à jour',
    'Refresh interval': 'Intervalle d’actualisation', 'Seconds between background updates': 'Secondes entre les mises à jour en arrière-plan', Language: 'Langue',
    'Interface language': "Langue de l’interface", 'Follow the system language or choose one for this extension': 'Utiliser la langue du système ou en choisir une pour cette extension',
    'Reopen Preferences to update all labels after changing the language.': 'Rouvrez les préférences pour actualiser tous les textes après un changement de langue.',
    Reset: 'Réinitialiser', 'Restore every extension setting to the defaults. Login files on disk are not deleted.': 'Rétablit tous les paramètres. Les fichiers de connexion ne sont pas supprimés.',
    'Reset settings': 'Réinitialiser les paramètres', 'Interval, providers, language, and credential path overrides': 'Intervalle, fournisseurs, langue et chemins personnalisés des identifiants',
    Accounts: 'Comptes', Account: 'Compte', 'Checking…': 'Vérification…', 'Sign in': 'Se connecter',
    'Cursor state database': "Base de données d’état de Cursor", 'Claude credentials.json': 'credentials.json de Claude', 'Codex auth.json': 'auth.json de Codex',
    About: 'À propos', Version: 'Version', License: 'Licence', Copyright: "Droits d’auteur", 'Project website': 'Site du projet', Open: 'Ouvrir',
    'Shows Cursor, Claude Code, and Codex plan usage in the GNOME top bar.': "Affiche l’utilisation des forfaits Cursor, Claude Code et Codex dans la barre supérieure de GNOME.",
    Found: 'Trouvé', 'Not found': 'Introuvable', 'No path': 'Aucun chemin', Custom: 'Personnalisé', 'Default:': 'Par défaut :', Default: 'Par défaut',
    'Reset settings?': 'Réinitialiser les paramètres ?',
    'Restore the default refresh interval, providers, language, and credential paths. Login files on disk are not deleted.':
        'Rétablit l’intervalle, les fournisseurs, la langue et les chemins des identifiants. Les fichiers de connexion ne sont pas supprimés.',
    Cancel: 'Annuler', 'Signed in with the Cursor app': "Connecté avec l’application Cursor", 'Signed in with cursor-agent': 'Connecté avec cursor-agent',
    'Signed in with Claude API': "Connecté avec l’API Claude", 'Signed in with the Claude Code CLI': 'Connecté avec la CLI Claude Code', 'Signed in with the Codex CLI': 'Connecté avec la CLI Codex',
    'Not signed in': 'Non connecté', Refresh: 'Actualiser', 'No providers enabled': 'Aucun fournisseur activé',
    'Turn on Cursor, Claude, or Codex in Preferences.': 'Activez Cursor, Claude ou Codex dans les préférences.', 'Updating…': 'Mise à jour…',
    'Signed in': 'Connecté', Usage: 'Utilisation', Settings: 'Paramètres', Limits: 'Limites', 'Tokens by day': 'Jetons par jour', 'Tokens by model': 'Jetons par modèle',
    'Resets in': 'Réinitialisation dans', Auto: 'Automatique', Today: "Aujourd’hui", 'Included total': 'Total inclus', 'Cursor Models': 'Modèles Cursor',
    soon: 'bientôt',
    'Other Models': 'Autres modèles', '5-hour': '5 heures', Weekly: 'Hebdomadaire', 'Weekly Opus': 'Opus hebdomadaire', 'Weekly Sonnet': 'Sonnet hebdomadaire',
    'Extra usage': 'Utilisation supplémentaire', 'Sign in to Cursor': 'Connectez-vous à Cursor', 'Sign in to Claude Code': 'Connectez-vous à Claude Code',
    'Sign in to Codex': 'Connectez-vous à Codex', 'Cursor limits unavailable': 'Limites Cursor indisponibles', 'Claude limits unavailable': 'Limites Claude indisponibles',
    'Codex limits unavailable': 'Limites Codex indisponibles',
    'Claude API login': "Connexion avec l’API Claude",
    'Usage response did not include rate limits.': "La réponse n’incluait pas de limites d’utilisation.",
    'Usage response did not include plan usage.': "La réponse n’incluait pas l’utilisation du forfait.", 'Usage response was not a JSON object.': "La réponse d’utilisation n’était pas un objet JSON.",
    'Could not reach Cursor usage API.': "Impossible d’accéder à l’API d’utilisation de Cursor.", 'Could not reach Claude usage API.': "Impossible d’accéder à l’API d’utilisation de Claude.",
    'Could not reach Codex usage API.': "Impossible d’accéder à l’API d’utilisation de Codex.", 'Could not reach the usage API': "Impossible d’accéder à l’API d’utilisation",
    'Usage API response was too large': "La réponse de l’API était trop volumineuse", 'Could not parse usage response': "Impossible d’analyser la réponse d’utilisation",
    'Usage API returned an unexpected redirect': "L’API a renvoyé une redirection inattendue", 'Usage API rate limited': "L’API a limité les requêtes",
    'Session expired': 'Session expirée', 'HTTP client was destroyed': 'Le client HTTP a été détruit', 'Invalid request URL': 'URL de requête invalide',
    'Usage API returned HTTP {status}': "L’API d’utilisation a renvoyé HTTP {status}",
    'Open Cursor and sign in, or run `cursor-agent login`.': 'Ouvrez Cursor et connectez-vous, ou exécutez `cursor-agent login`.',
    'Install the Claude Code CLI and run `claude login`.': 'Installez la CLI Claude Code et exécutez `claude login`.',
    'Install the Codex CLI and run `codex login`.': 'Installez la CLI Codex et exécutez `codex login`.',
    'Cursor session expired. Open Cursor and sign in again, or run `cursor-agent login`.':
        'La session Cursor a expiré. Reconnectez-vous dans Cursor ou exécutez `cursor-agent login`.',
    'Claude session expired. Run `claude login` again.': 'La session Claude a expiré. Exécutez de nouveau `claude login`.',
    'Codex session expired. Run `codex login` again.': 'La session Codex a expiré. Exécutez de nouveau `codex login`.',
    'Usage API rate limited. Try again in a few minutes.': 'L’API a limité les requêtes. Réessayez dans quelques minutes.',
    'This login is API / prepaid. Plan bars (5-hour and weekly) need `claude login` and the Claude.ai Pro/Max option.':
        'Cette connexion utilise l’API ou le prépaiement. Les barres sur 5 heures et hebdomadaire exigent `claude login` avec Claude.ai Pro/Max.',
    'A browser window should open. Finish signing in with cursor-agent, then return here.':
        'Une fenêtre de navigateur va s’ouvrir. Terminez la connexion avec cursor-agent, puis revenez ici.',
    'Sign in inside the Cursor app, then return here.': 'Connectez-vous dans l’application Cursor, puis revenez ici.',
    'Open Cursor and sign in, or install cursor-agent and run `cursor-agent login`.':
        'Ouvrez Cursor et connectez-vous, ou installez cursor-agent et exécutez `cursor-agent login`.',
    'A browser window should open. Finish signing in with Codex, then return here.':
        'Une fenêtre de navigateur va s’ouvrir. Terminez la connexion avec Codex, puis revenez ici.',
    'Install the Codex CLI and run `codex login`, then return here.':
        'Installez la CLI Codex, exécutez `codex login`, puis revenez ici.',
    'A browser window should open. Finish signing in with Claude Code, then return here.':
        'Une fenêtre de navigateur va s’ouvrir. Terminez la connexion avec Claude Code, puis revenez ici.',
    'Install the Claude Code CLI and run `claude login`, then return here.':
        'Installez la CLI Claude Code, exécutez `claude login`, puis revenez ici.',
    'The extension reads the local Cursor token. Leave a path empty to use the default. Fill it only if Cursor is installed somewhere else.':
        'L’extension lit le jeton Cursor local. Laissez le chemin vide pour utiliser celui par défaut et renseignez-le seulement si Cursor est installé ailleurs.',
    'The extension reads the local Claude Code token. Leave the path empty to use the default. Fill it only if Claude Code is installed somewhere else.':
        'L’extension lit le jeton Claude Code local. Laissez le chemin vide pour utiliser celui par défaut et renseignez-le seulement s’il est installé ailleurs.',
    'The extension reads the local Codex token. Leave the path empty to use the default. Fill it only if Codex is installed somewhere else.':
        'L’extension lit le jeton Codex local. Laissez le chemin vide pour utiliser celui par défaut et renseignez-le seulement si Codex est installé ailleurs.',
    'Token from the Cursor app. Default: ~/.config/Cursor/User/globalStorage/state.vscdb. Leave empty to use that path.':
        'Jeton de l’application Cursor. Par défaut : ~/.config/Cursor/User/globalStorage/state.vscdb. Laissez vide pour utiliser ce chemin.',
    'Token from `cursor-agent login`. Default: ~/.config/cursor/auth.json. Leave empty to use that path.':
        'Jeton de `cursor-agent login`. Par défaut : ~/.config/cursor/auth.json. Laissez vide pour utiliser ce chemin.',
    'Token from the Claude Code CLI. Default: ~/.claude/.credentials.json. Leave empty to use that path.':
        'Jeton de la CLI Claude Code. Par défaut : ~/.claude/.credentials.json. Laissez vide pour utiliser ce chemin.',
    'Token from the Codex CLI. Default: ~/.codex/auth.json. Leave empty to use that path.':
        'Jeton de la CLI Codex. Par défaut : ~/.codex/auth.json. Laissez vide pour utiliser ce chemin.',
};

const DE = {
    'System default': 'Systemsprache', General: 'Allgemein', Appearance: 'Erscheinungsbild',
    'The extension follows the GNOME accent color and light or dark style.': 'Die Erweiterung folgt der GNOME-Akzentfarbe und dem hellen oder dunklen Stil.',
    'Show percentage on the panel': 'Prozentwert im Panel anzeigen', 'Display the active provider usage next to the icon': 'Zeigt die Nutzung des aktiven Anbieters neben dem Symbol an',
    Providers: 'Anbieter', 'Show Cursor plan usage': 'Cursor-Tarifnutzung anzeigen', 'Show Claude Code plan usage': 'Claude-Code-Tarifnutzung anzeigen',
    'Show Codex plan usage': 'Codex-Tarifnutzung anzeigen', 'Default provider': 'Standardanbieter',
    'Shown in the panel and selected when the menu opens': 'Wird im Panel angezeigt und beim Öffnen des Menüs ausgewählt', Updates: 'Aktualisierungen',
    'Refresh interval': 'Aktualisierungsintervall', 'Seconds between background updates': 'Sekunden zwischen Hintergrundaktualisierungen', Language: 'Sprache',
    'Interface language': 'Sprache der Benutzeroberfläche', 'Follow the system language or choose one for this extension': 'Systemsprache verwenden oder eine Sprache für diese Erweiterung wählen',
    'Reopen Preferences to update all labels after changing the language.': 'Öffnen Sie die Einstellungen erneut, um nach einem Sprachwechsel alle Texte zu aktualisieren.',
    Reset: 'Zurücksetzen', 'Restore every extension setting to the defaults. Login files on disk are not deleted.': 'Setzt alle Einstellungen zurück. Anmeldedateien werden nicht gelöscht.',
    'Reset settings': 'Einstellungen zurücksetzen', 'Interval, providers, language, and credential path overrides': 'Intervall, Anbieter, Sprache und benutzerdefinierte Anmeldepfade',
    Accounts: 'Konten', Account: 'Konto', 'Checking…': 'Wird geprüft…', 'Sign in': 'Anmelden',
    'Cursor state database': 'Cursor-Statusdatenbank', 'Claude credentials.json': 'Claude credentials.json', 'Codex auth.json': 'Codex auth.json',
    About: 'Info', Version: 'Version', License: 'Lizenz', Copyright: 'Urheberrecht', 'Project website': 'Projektwebsite', Open: 'Öffnen',
    'Shows Cursor, Claude Code, and Codex plan usage in the GNOME top bar.': 'Zeigt die Tarifnutzung von Cursor, Claude Code und Codex in der oberen GNOME-Leiste an.',
    Found: 'Gefunden', 'Not found': 'Nicht gefunden', 'No path': 'Kein Pfad', Custom: 'Benutzerdefiniert', 'Default:': 'Standard:', Default: 'Standard',
    'Reset settings?': 'Einstellungen zurücksetzen?',
    'Restore the default refresh interval, providers, language, and credential paths. Login files on disk are not deleted.':
        'Setzt Intervall, Anbieter, Sprache und Anmeldepfade zurück. Anmeldedateien werden nicht gelöscht.',
    Cancel: 'Abbrechen', 'Signed in with the Cursor app': 'Mit der Cursor-App angemeldet', 'Signed in with cursor-agent': 'Mit cursor-agent angemeldet',
    'Signed in with Claude API': 'Mit der Claude-API angemeldet',
    'Signed in with the Claude Code CLI': 'Mit der Claude-Code-CLI angemeldet',
    'Signed in with the Codex CLI': 'Mit der Codex-CLI angemeldet',
    'Not signed in': 'Nicht angemeldet', Refresh: 'Aktualisieren', 'No providers enabled': 'Keine Anbieter aktiviert',
    'Turn on Cursor, Claude, or Codex in Preferences.': 'Aktivieren Sie Cursor, Claude oder Codex in den Einstellungen.', 'Updating…': 'Wird aktualisiert…',
    'Signed in': 'Angemeldet', Usage: 'Nutzung', Settings: 'Einstellungen', Limits: 'Limits', 'Tokens by day': 'Token pro Tag', 'Tokens by model': 'Token nach Modell',
    'Resets in': 'Zurücksetzung in', Auto: 'Automatisch', Today: 'Heute', 'Included total': 'Enthaltene Gesamtnutzung', 'Cursor Models': 'Cursor-Modelle',
    soon: 'bald',
    'Other Models': 'Andere Modelle', '5-hour': '5 Stunden', Weekly: 'Wöchentlich', 'Weekly Opus': 'Opus wöchentlich', 'Weekly Sonnet': 'Sonnet wöchentlich',
    'Extra usage': 'Zusätzliche Nutzung', 'Sign in to Cursor': 'Bei Cursor anmelden', 'Sign in to Claude Code': 'Bei Claude Code anmelden', 'Sign in to Codex': 'Bei Codex anmelden',
    'Cursor limits unavailable': 'Cursor-Limits nicht verfügbar', 'Claude limits unavailable': 'Claude-Limits nicht verfügbar', 'Codex limits unavailable': 'Codex-Limits nicht verfügbar',
    'Claude API login': 'Claude-API-Anmeldung', 'Usage response did not include rate limits.': 'Die Antwort enthielt keine Nutzungslimits.',
    'Usage response did not include plan usage.': 'Die Antwort enthielt keine Tarifnutzung.', 'Usage response was not a JSON object.': 'Die Nutzungsantwort war kein JSON-Objekt.',
    'Could not reach Cursor usage API.': 'Die Cursor-Nutzungs-API war nicht erreichbar.', 'Could not reach Claude usage API.': 'Die Claude-Nutzungs-API war nicht erreichbar.',
    'Could not reach Codex usage API.': 'Die Codex-Nutzungs-API war nicht erreichbar.', 'Could not reach the usage API': 'Die Nutzungs-API war nicht erreichbar',
    'Usage API response was too large': 'Die Antwort der Nutzungs-API war zu groß', 'Could not parse usage response': 'Die Nutzungsantwort konnte nicht verarbeitet werden',
    'Usage API returned an unexpected redirect': 'Die Nutzungs-API gab eine unerwartete Weiterleitung zurück', 'Usage API rate limited': 'Die Nutzungs-API hat Anfragen begrenzt',
    'Session expired': 'Sitzung abgelaufen', 'HTTP client was destroyed': 'Der HTTP-Client wurde zerstört', 'Invalid request URL': 'Ungültige Anfrage-URL',
    'Usage API returned HTTP {status}': 'Die Nutzungs-API gab HTTP {status} zurück',
    'Open Cursor and sign in, or run `cursor-agent login`.': 'Öffnen Sie Cursor und melden Sie sich an oder führen Sie `cursor-agent login` aus.',
    'Install the Claude Code CLI and run `claude login`.': 'Installieren Sie die Claude-Code-CLI und führen Sie `claude login` aus.',
    'Install the Codex CLI and run `codex login`.': 'Installieren Sie die Codex-CLI und führen Sie `codex login` aus.',
    'Cursor session expired. Open Cursor and sign in again, or run `cursor-agent login`.':
        'Die Cursor-Sitzung ist abgelaufen. Melden Sie sich erneut an oder führen Sie `cursor-agent login` aus.',
    'Claude session expired. Run `claude login` again.': 'Die Claude-Sitzung ist abgelaufen. Führen Sie erneut `claude login` aus.',
    'Codex session expired. Run `codex login` again.': 'Die Codex-Sitzung ist abgelaufen. Führen Sie erneut `codex login` aus.',
    'Usage API rate limited. Try again in a few minutes.': 'Die API hat Anfragen begrenzt. Versuchen Sie es in einigen Minuten erneut.',
    'This login is API / prepaid. Plan bars (5-hour and weekly) need `claude login` and the Claude.ai Pro/Max option.':
        'Diese Anmeldung nutzt API oder Prepaid. Die 5-Stunden- und Wochenanzeigen benötigen `claude login` mit Claude.ai Pro/Max.',
    'A browser window should open. Finish signing in with cursor-agent, then return here.':
        'Ein Browserfenster sollte sich öffnen. Schließen Sie die Anmeldung mit cursor-agent ab und kehren Sie hierher zurück.',
    'Sign in inside the Cursor app, then return here.': 'Melden Sie sich in der Cursor-App an und kehren Sie hierher zurück.',
    'Open Cursor and sign in, or install cursor-agent and run `cursor-agent login`.':
        'Öffnen Sie Cursor und melden Sie sich an oder installieren Sie cursor-agent und führen Sie `cursor-agent login` aus.',
    'A browser window should open. Finish signing in with Codex, then return here.':
        'Ein Browserfenster sollte sich öffnen. Schließen Sie die Codex-Anmeldung ab und kehren Sie hierher zurück.',
    'Install the Codex CLI and run `codex login`, then return here.':
        'Installieren Sie die Codex-CLI, führen Sie `codex login` aus und kehren Sie hierher zurück.',
    'A browser window should open. Finish signing in with Claude Code, then return here.':
        'Ein Browserfenster sollte sich öffnen. Schließen Sie die Claude-Code-Anmeldung ab und kehren Sie hierher zurück.',
    'Install the Claude Code CLI and run `claude login`, then return here.':
        'Installieren Sie die Claude-Code-CLI, führen Sie `claude login` aus und kehren Sie hierher zurück.',
    'The extension reads the local Cursor token. Leave a path empty to use the default. Fill it only if Cursor is installed somewhere else.':
        'Die Erweiterung liest das lokale Cursor-Token. Lassen Sie den Pfad für den Standardwert leer und füllen Sie ihn nur aus, wenn Cursor woanders installiert ist.',
    'The extension reads the local Claude Code token. Leave the path empty to use the default. Fill it only if Claude Code is installed somewhere else.':
        'Die Erweiterung liest das lokale Claude-Code-Token. Lassen Sie den Pfad für den Standardwert leer und füllen Sie ihn nur aus, wenn es woanders installiert ist.',
    'The extension reads the local Codex token. Leave the path empty to use the default. Fill it only if Codex is installed somewhere else.':
        'Die Erweiterung liest das lokale Codex-Token. Lassen Sie den Pfad für den Standardwert leer und füllen Sie ihn nur aus, wenn Codex woanders installiert ist.',
    'Token from the Cursor app. Default: ~/.config/Cursor/User/globalStorage/state.vscdb. Leave empty to use that path.':
        'Token der Cursor-App. Standard: ~/.config/Cursor/User/globalStorage/state.vscdb. Leer lassen, um diesen Pfad zu verwenden.',
    'Token from `cursor-agent login`. Default: ~/.config/cursor/auth.json. Leave empty to use that path.':
        'Token von `cursor-agent login`. Standard: ~/.config/cursor/auth.json. Leer lassen, um diesen Pfad zu verwenden.',
    'Token from the Claude Code CLI. Default: ~/.claude/.credentials.json. Leave empty to use that path.':
        'Token der Claude-Code-CLI. Standard: ~/.claude/.credentials.json. Leer lassen, um diesen Pfad zu verwenden.',
    'Token from the Codex CLI. Default: ~/.codex/auth.json. Leave empty to use that path.':
        'Token der Codex-CLI. Standard: ~/.codex/auth.json. Leer lassen, um diesen Pfad zu verwenden.',
};

const CATALOGS = {
    pt: PT,
    'pt-BR': PT_BR,
    es: ES,
    fr: FR,
    de: DE,
};

let languagePreference = 'system';

export function configureLanguage(preference) {
    languagePreference = LANGUAGE_OPTIONS.some(option => option.id === preference)
        ? preference
        : 'system';
}

export function languageIndex(preference) {
    const index = LANGUAGE_OPTIONS.findIndex(option => option.id === preference);
    return index >= 0 ? index : 0;
}

export function gettext(message) {
    return CATALOGS[currentLanguage()]?.[message] ?? message;
}

export function currentLanguage() {
    return languagePreference === 'system'
        ? systemLanguage()
        : languagePreference;
}

export function currentLocale() {
    const language = currentLanguage();
    return language === 'pt' ? 'pt-PT' : language;
}

export function formatMessage(message, values) {
    return Object.entries(values).reduce((text, [key, value]) => {
        return text.replaceAll(`{${key}}`, String(value));
    }, gettext(message));
}

function systemLanguage() {
    for (const locale of GLib.get_language_names()) {
        const normalized = normalizeLanguage(locale);
        if (normalized)
            return normalized;
    }
    return 'en';
}

function normalizeLanguage(locale) {
    const value = String(locale).split('.')[0].replaceAll('_', '-').toLowerCase();
    if (value.startsWith('pt-br'))
        return 'pt-BR';
    for (const language of ['pt', 'es', 'fr', 'de', 'en']) {
        if (value === language || value.startsWith(`${language}-`))
            return language;
    }
    return '';
}
