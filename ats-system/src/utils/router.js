/**
 * Router - Simple hash-based client-side router for ATS System
 * Supports route parameters, navigation history, and wildcard routes.
 */
const Router = (() => {
  let _currentRoute = null;
  let _currentParams = {};
  let _routes = {};
  let _history = [];
  let _onNavigate = null;
  let _notFoundHandler = null;
  let _initialized = false;

  /**
   * Parse a hash path into segments
   * e.g. "#/candidates/123" → ["candidates", "123"]
   */
  function parsePath(hash) {
    const path = (hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
    return path ? path.split('/') : [];
  }

  /**
   * Match a URL path against a registered route pattern.
   * Pattern can contain :param segments.
   * Returns { matched, params } or null.
   */
  function matchRoute(urlSegments, patternSegments) {
    if (urlSegments.length !== patternSegments.length) return null;

    const params = {};
    for (let i = 0; i < patternSegments.length; i++) {
      const pat = patternSegments[i];
      const url = urlSegments[i];
      if (pat.startsWith(':')) {
        params[pat.substring(1)] = decodeURIComponent(url);
      } else if (pat !== url) {
        return null;
      }
    }
    return params;
  }

  /**
   * Find the best matching route for the current hash
   */
  function resolveRoute(hash) {
    const urlSegments = parsePath(hash);

    // Try exact match first, then parameterized
    let bestMatch = null;
    let bestParams = {};
    let bestSpecificity = -1;

    for (const pattern in _routes) {
      const patternSegments = parsePath('#/' + pattern);
      const params = matchRoute(urlSegments, patternSegments);

      if (params !== null) {
        // Calculate specificity: more literal segments = better match
        let specificity = 0;
        for (const seg of patternSegments) {
          if (!seg.startsWith(':')) specificity++;
        }
        if (specificity > bestSpecificity) {
          bestSpecificity = specificity;
          bestMatch = pattern;
          bestParams = params;
        }
      }
    }

    return bestMatch !== null
      ? { pattern: bestMatch, handler: _routes[bestMatch], params: bestParams }
      : null;
  }

  /**
   * Handle hash change event
   */
  function handleHashChange() {
    const hash = window.location.hash || '#/portal';
    const resolved = resolveRoute(hash);

    if (resolved) {
      _currentRoute = resolved.pattern;
      _currentParams = resolved.params;

      if (_onNavigate) {
        _onNavigate(_currentRoute, _currentParams);
      }

      resolved.handler(_currentParams);
    } else if (_notFoundHandler) {
      _currentRoute = '404';
      _currentParams = {};
      _notFoundHandler();
    } else {
      console.warn('[Router] No route matched:', hash);
    }

    // Initialize Lucide icons after page render
    requestAnimationFrame(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    });
  }

  return {
    /**
     * Get the current route pattern
     */
    get currentRoute() {
      return _currentRoute;
    },

    /**
     * Get all registered routes
     */
    get routes() {
      return { ..._routes };
    },

    /**
     * Register a route handler
     * @param {string} path - Route pattern (e.g. "candidates", "candidates/:id")
     * @param {Function} handler - Function(params) to call when route matches
     */
    register(path, handler) {
      const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
      _routes[cleanPath] = handler;
    },

    /**
     * Register a handler for 404 / not found
     */
    registerNotFound(handler) {
      _notFoundHandler = handler;
    },

    /**
     * Set a global navigation callback (called before route handler)
     */
    onNavigate(callback) {
      _onNavigate = callback;
    },

    /**
     * Navigate to a path
     * @param {string} path - Target path (e.g. "/candidates/123")
     * @param {Object} params - Optional query params (stored in _currentParams)
     */
    navigate(path, params) {
      // Save current route in history
      if (window.location.hash) {
        _history.push(window.location.hash);
      }

      // Merge extra params
      if (params) {
        _currentParams = { ..._currentParams, ...params };
      }

      const cleanPath = path.replace(/^#?\/?/, '');
      window.location.hash = '#/' + cleanPath;
    },

    /**
     * Go back to previous route
     */
    back() {
      if (_history.length > 0) {
        const prev = _history.pop();
        window.location.hash = prev;
      } else {
        window.location.hash = '#/portal';
      }
    },

    /**
     * Get parameters from the current route
     */
    getParams() {
      return { ..._currentParams };
    },

    /**
     * Get a specific parameter value
     */
    getParam(name) {
      return _currentParams[name] || null;
    },

    /**
     * Get the current hash path as a clean string
     */
    getCurrentPath() {
      return (window.location.hash || '#/portal').replace(/^#\/?/, '');
    },

    /**
     * Check if the current route matches a pattern
     */
    isActive(path) {
      const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
      if (_currentRoute === cleanPath) return true;
      // Check if current route starts with path (for parent highlighting)
      return _currentRoute ? _currentRoute.startsWith(cleanPath) : false;
    },

    /**
     * Initialize the router - listen for hash changes and process initial route
     */
    init() {
      if (_initialized) return;
      _initialized = true;

      window.addEventListener('hashchange', handleHashChange);

      // Handle initial route
      if (!window.location.hash) {
        window.location.hash = '#/portal';
      } else {
        handleHashChange();
      }
    },

    /**
     * Destroy the router (cleanup)
     */
    destroy() {
      window.removeEventListener('hashchange', handleHashChange);
      _routes = {};
      _history = [];
      _currentRoute = null;
      _currentParams = {};
      _initialized = false;
    },
  };
})();
