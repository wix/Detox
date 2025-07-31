<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <!-- Cached variables for template data -->
  <xsl:variable name="activePtr" select="/ViewHierarchy/@active-ptr"/>
  <xsl:variable name="win" select="/ViewHierarchy/*[1]"/>
  <xsl:variable name="shot" select="/ViewHierarchy/@screenshot"/>

  <xsl:output method="html" indent="yes" encoding="utf-8"/>

  <!-- Main page template -->
  <xsl:template match="/">
    <html>
      <head>
        <title>Detox View Hierarchy</title>

        <style>
          :root {
            --clr-bg: #fafafa;
            --clr-meta-bg: #333;
            --clr-meta-fg: #fff;
            --clr-active: #ff0080;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--clr-bg);
            margin: 1rem 1rem 10rem;
          }

          header h1 {
            margin: 0 0 1.25rem;
            text-align: center;
          }

          .instructions {
            margin: 0 0 1.5rem;
            text-align: center;
            font-size: 0.85rem;
            color: #555;
          }

          /* Canvas container styles */
          .root {
            position: relative;
            border: 2px solid #001;
            margin: auto;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
          }

          /* Node element styles */
          .node {
            position: absolute;
            z-index: 1;
            box-sizing: border-box;
            font-size: 11px;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid #a050c0;
            transition: background 0.1s, border 0.1s;
            cursor: pointer;
          }

          .node:hover {
            background: rgba(255, 255, 0, 0.25);
          }

          /* Depth-based border colors */
          .d0 { border-color: #2050ff; }
          .d1 { border-color: #008c8c; }
          .d2 { border-color: #40a000; }
          .d3 { border-color: #c0a000; }
          .d4 { border-color: #c06060; }

          /* Special state styles */
          .active {
            outline: 3px solid var(--clr-active);
            background: rgba(255, 0, 128, 0.08);
          }

          .invisible {
            outline: 1px dashed rgba(255, 0, 0, 0.5);
          }

          /* Screenshot mode adjustments */
          .root.bg .node {
            background: transparent;
            border: none;
          }

          .root.bg .node:hover {
            border: 1px solid rgba(0, 0, 0, 0.3);
          }

          /* Node text styling */
          .txt {
            pointer-events: none;
          }

          .root.bg .txt {
            display: none;
          }

          /* Tooltip styles */
          .meta {
            position: absolute;
            left: 100%;
            top: 0;
            margin-left: 6px;
            max-width: 260px;
            display: none;
            pointer-events: none;
            z-index: 9999;
            background: var(--clr-meta-bg);
            color: var(--clr-meta-fg);
            padding: 6px 8px;
            font-size: 10px;
            line-height: 1.3;
            border-radius: 4px;
          }

          .node:hover {
            overflow: visible;
          }

          .node:hover > .meta {
            display: block;
          }
        </style>
      </head>

      <body>
        <header>
          <h1>Detox Hierarchy Snapshot</h1>
          <p class="instructions">
            Hover a box to see attributes — failed elements are outlined in magenta.
          </p>
        </header>

        <!-- Canvas container with optional screenshot background -->
        <div>
          <xsl:attribute name="class">
            root<xsl:if test="$shot != ''"> bg</xsl:if>
          </xsl:attribute>

          <xsl:attribute name="style">
            <xsl:if test="$win/@width">width: <xsl:value-of select="$win/@width"/>px;</xsl:if>
            <xsl:if test="$win/@height">height: <xsl:value-of select="$win/@height"/>px;</xsl:if>
            <xsl:if test="$shot != ''">
              background: url('<xsl:value-of select="$shot"/>') 0 0/contain no-repeat;
            </xsl:if>
          </xsl:attribute>

          <!-- Render all view nodes -->
          <xsl:apply-templates select="ViewHierarchy//*"/>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- Individual view node template -->
  <xsl:template match="*">
    <div>
      <xsl:attribute name="class">
        <xsl:text>node d</xsl:text><xsl:value-of select="count(ancestor::*)"/>
        <xsl:if test="@visibility != 'visible'"> invisible</xsl:if>
        <xsl:if test="@ptr = $activePtr"> active</xsl:if>
      </xsl:attribute>

      <xsl:attribute name="style">
        left: <xsl:value-of select="@x"/>px;
        top: <xsl:value-of select="@y"/>px;
        width: <xsl:value-of select="@width"/>px;
        height: <xsl:value-of select="@height"/>px;
        <xsl:if test="@alpha">opacity: <xsl:value-of select="@alpha"/>;</xsl:if>
      </xsl:attribute>

      <!-- Display text or label when available -->
      <xsl:choose>
        <xsl:when test="normalize-space(@text) != ''">
          <span class="txt"><xsl:value-of select="@text"/></span>
        </xsl:when>
        <xsl:when test="normalize-space(@label) != ''">
          <span class="txt"><xsl:value-of select="@label"/></span>
        </xsl:when>
      </xsl:choose>

      <!-- Attribute tooltip -->
      <div class="meta">
        <strong><xsl:value-of select="name()"/></strong>
        <xsl:for-each select="@*">
          <br/><xsl:value-of select="name()"/>="<xsl:value-of select="."/>"
        </xsl:for-each>
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>
