module.exports = {
  name:        "default template",
  description: "creates a basic ShadowEngine project",
  variables:   {
    "FULL_NAME":    [/^[a-zA-Z\s\-]/,           "Full Name",      "My Game"],
    "NAME":         [/^[a-zA-Z\s\-]/,           "Name",           "MyGame"],
    "DESCRIPTION":  [/^[a-zA-Z\s\-]/,           "Description",    ""],
    "VERSION":      [/^[0-9]+\.[0-9]+\.[0-9]+/, "Version",        "0.1.0"],
    "AUTHOR_NAME":  [/^[a-zA-Z\s\-]/,           "Author (name)",  ""],
    "AUTHOR_EMAIL": [/^[a-zA-Z\s\-]/,           "Author (email)", ""],
    "AUTHOR_URL":   [/^[a-zA-Z\s\-]/,           "Author (url)",   ""],
    "LICENSE":      [/^[a-zA-Z\s\-]/,           "License",         "SEE LICENSE IN LICENSE.md"]
  }
}
