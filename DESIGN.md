---
name: Tizo Ecommerce
description: Comercio y operaciones en una misma interfaz cálida, precisa y auditable.
colors:
  ink: '#17171a'
  ink-soft: '#4a4a50'
  muted: '#686870'
  paper: '#f7f7f4'
  panel: '#ffffff'
  border: '#e8e7e2'
  action: '#242427'
  accent-violet: '#6356d9'
  success: '#247557'
  warning: '#8f560e'
  danger: '#b24338'
typography:
  display:
    fontFamily: 'Manrope, sans-serif'
    fontSize: 'clamp(36px, 5.4vw, 68px)'
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: '-0.06em'
  headline:
    fontFamily: 'Manrope, sans-serif'
    fontSize: 'clamp(24px, 2.5vw, 29px)'
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: '-0.04em'
  body:
    fontFamily: 'Manrope, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Manrope, sans-serif'
    fontSize: '12px'
    fontWeight: 700
    lineHeight: 1
rounded:
  control: '10px'
  card: '14px'
  panel: '17px'
  hero: '24px'
  pill: '999px'
spacing:
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.action}'
    textColor: '{colors.panel}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '40px'
  button-secondary:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.ink-soft}'
    typography: '{typography.label}'
    rounded: '{rounded.control}'
    padding: '0 16px'
    height: '40px'
  field:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.control}'
    padding: '10px 12px'
    height: '42px'
  panel:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.ink}'
    rounded: '{rounded.panel}'
    padding: '24px'
---

# Design System: Tizo Ecommerce

## Overview

**Creative North Star: "La mesa de control cálida"**

Tizo une una tienda editorial sobria con un backoffice de alta precisión. El sistema evita el gris
corporativo frío: usa papel tibio, tinta casi negra y un violeta escaso que conecta foco, selección
y dinero vigente. La superficie cliente tiene más aire e imagen; Operaciones concentra datos,
vigencia y consecuencias sin perder la misma identidad.

La tarea siempre domina la decoración. Las decisiones sensibles muestran estado, monto, contexto y
efecto operacional cerca de la acción. La iconografía Lucide y las etiquetas textuales trabajan
juntas; ningún significado depende solo del color.

**Key Characteristics:**

- Papel cálido, paneles blancos y divisiones discretas.
- Jerarquía compacta en Operaciones y expresiva en el marketplace.
- Acciones primarias oscuras; violeta reservado para continuidad, foco y montos vigentes.
- Estados tipados, recuperaciones explícitas y lectura cómoda desde 360 px.

## Colors

La paleta combina neutrales cálidos con un acento violeta de continuidad y estados semánticos de
alto contraste. Los valores normativos viven en el frontmatter y en `src/styles/_tokens.scss`.

### Primary

- **Tinta de acción:** botones principales, encabezados oscuros y la superficie hero.
- **Violeta de continuidad:** foco, selección, navegación activa y total vigente.

### Secondary

- **Verde de confirmación:** resultados completados y presencia en línea.
- **Ámbar operacional:** advertencias, vigencia y estados de preparación.
- **Rojo de decisión:** rechazo, error y acciones destructivas.

### Neutral

- **Papel Tizo:** fondo general ligeramente cálido.
- **Panel limpio:** contenido elevado y controles.
- **Borde de papel:** divisiones y agrupaciones sin endurecer la pantalla.
- **Tinta y tinta suave:** contenido principal, explicaciones y metadatos.

### Named Rules

**The One Action Rule.** La acción principal es casi negra; el violeta no compite como relleno de
botones primarios.

**The State in Words Rule.** Todo color semántico aparece con texto y, cuando ayuda, con icono.

## Typography

**Display Font:** Manrope (con fallback `sans-serif`)
**Body Font:** Manrope (con fallback `sans-serif`)

**Character:** Una sola familia sostiene tienda y operaciones. El peso, la escala y la densidad
cambian por superficie, sin introducir una segunda voz tipográfica.

### Hierarchy

- **Display:** peso 800 y altura compacta; reservado al mensaje principal del marketplace.
- **Headline:** peso 800 y tracking negativo; identifica páginas, órdenes y solicitudes.
- **Title:** entre 14 y 22 px, peso 700–800; organiza paneles y productos.
- **Body:** 12–15 px y altura 1.5–1.7; las explicaciones largas no superan aproximadamente 68ch.
- **Label:** 9.5–12.5 px y peso 700; describe campos, estados y metadatos de entidad.

### Named Rules

**The Numeric Clarity Rule.** Montos, versiones y contadores usan cifras tabulares y peso alto.

## Layout

El cliente usa una cabecera compacta y contenido centrado; el catálogo pasa de cuatro columnas a
dos en móvil. El backoffice usa una barra lateral de 226 px y una zona de trabajo fluida hasta
1440 px. Los paneles de lista y detalle comparten un solo marco; no se separan en tarjetas sin
relación.

A 1000 px se reduce la proporción del panel dividido. Bajo 900 px la navegación operacional cambia
de topología y bajo 768 px los paneles se apilan, las tablas se convierten en filas/tarjetas y las
acciones aprovechan todo el ancho. El ancho mínimo contractual es 360 px.

**The One Working Surface Rule.** Una investigación de lista y detalle conserva continuidad visual
y espacial; el cambio responsive puede apilarla, pero no fragmentar su contexto.

## Elevation & Depth

El sistema es plano por defecto. La profundidad nace de papel sobre papel, bordes cálidos y una
sombra ambiental casi imperceptible en paneles principales. El marketplace admite una excepción
expresiva: el orbe violeta del hero usa profundidad difusa para equilibrar la gran masa tipográfica.

### Shadow Vocabulary

- **Panel ambiental:** sombra amplia al 3.5% para separar marcos de trabajo sin efecto flotante.
- **Foco accesible:** anillo violeta de 3 px para teclado y campos activos.
- **Orbe de temporada:** sombra violeta difusa, exclusiva del arte principal del marketplace.

### Named Rules

**The Flat-by-Default Rule.** Una sombra no crea jerarquía por sí sola; primero deben resolverla
la agrupación, el contraste tonal y el borde.

## Shapes

Los controles usan esquinas compactas, las tarjetas una curva media y los paneles exteriores una
curva mayor. Pills completas se reservan para estados, filtros y categorías. El hero comercial puede
usar 24 px y formas circulares; las superficies operacionales mantienen geometría más disciplinada.

## Components

### Buttons

- **Shape:** control compacto de 40 px de alto y radio de control.
- **Primary:** fondo de acción, texto blanco y peso 700.
- **Hover / Focus:** tinta más profunda al hover, desplazamiento de 1 px al activar y anillo visible
  al teclado.
- **Secondary / Danger:** panel con borde cálido para secundario; rojo semántico para destrucción.

### Chips

- **Style:** pill tonal con punto o icono y etiqueta textual; nunca un color desnudo.
- **State:** selección violeta; progreso usa el color semántico correspondiente.

### Cards / Containers

- **Corner Style:** radio de tarjeta dentro de paneles; radio de panel en la envolvente principal.
- **Background:** panel blanco sobre papel Tizo.
- **Shadow Strategy:** plana por defecto, ambiental solo en paneles principales.
- **Border:** división cálida de 1 px.
- **Internal Padding:** ritmo base entre 12 y 24 px según densidad.

### Inputs / Fields

- **Style:** 42 px mínimo, panel blanco, borde cálido y radio de control.
- **Focus:** borde y anillo violeta.
- **Error / Disabled:** mensaje textual rojo; opacidad reducida sin perder el nombre accesible.

### Navigation

La navegación activa combina fondo sutil, icono y peso. En móvil, Operaciones usa una barra fija
inferior y el cliente conserva una cabecera de iconos compacta.

### Operational Decision Panel

Agrupa estado vigente, consecuencia, confirmación y recuperación. En móvil se integra al flujo
vertical; no queda como un drawer estrecho o cortado.

## Do's and Don'ts

### Do:

- **Do** mantener monto, estado y efecto cerca de cada decisión operacional.
- **Do** usar Lucide con etiqueta o nombre accesible para acciones y navegación.
- **Do** conservar datos anteriores durante refreshing y explicar la recuperación ante errores.
- **Do** comprobar 1280, 768, 390 y el ancho mínimo de 360 px.

### Don't:

- **Don't** usar violeta como relleno de la acción primaria.
- **Don't** convertir cada métrica o fila en una tarjeta independiente.
- **Don't** comunicar estado, riesgo o selección únicamente mediante color.
- **Don't** inventar kickers decorativos; una etiqueta compacta debe identificar marca, entidad,
  estado o sección real.
- **Don't** usar emoji, caracteres Unicode o glifos tipográficos como iconos de interfaz.
