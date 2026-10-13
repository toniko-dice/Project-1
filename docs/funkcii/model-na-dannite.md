# Модел на данните — общо

<!-- Пренесено дословно от CLAUDE.md на 13.10.2026 (task-claude-md-prenarezhdane.md). -->

Колекции, глобали, горната лента.

## Модел на данните

**Колекции:** `pages`, `products`, `categories`, `menu-panels`, `media`,
`testimonials`, `awards`, `subscribers`, `users`, `quote-requests`,
`quote-files`, `offers`, `contact-messages`, `dice-syncs`, `price-approvals`,
`price-history`

**Глобални:** `header`, `footer`, `design`, `site-settings`, `filter-order`,
`offer-settings`, `info-pages`

Тънката сива лента над менюто (линк, промо текст, надпис за регион) се
управлява от `utilityBarEnabled` в „Меню (хедър)" и е **изключена по
подразбиране**. Полетата ѝ се пазят — включването е една отметка. Тъмната
промо лента е отделна и се управлява от „Общи настройки".
