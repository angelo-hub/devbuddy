import * as vscode from "vscode";
import { BaseTicket } from "./BaseTicketProvider";

/**
 * Abstract base class for ticket detail webview panels
 * Provides common patterns for displaying ticket details across platforms
 */
export abstract class BaseTicketPanel<TTicket extends BaseTicket> {
  public static currentPanel: BaseTicketPanel<any> | undefined;
  protected readonly _panel: vscode.WebviewPanel;
  protected readonly _extensionUri: vscode.Uri;
  protected _disposables: vscode.Disposable[] = [];

  protected constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    protected ticket: TTicket
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._setWebviewMessageListener();
  }

  /**
   * Update the webview content
   */
  protected _update(): void {
    const webview = this._panel.webview;
    this._panel.title = this.ticket.identifier;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  /**
   * Get the HTML content for the webview
   */
  protected abstract _getHtmlForWebview(webview: vscode.Webview): string;

  /**
   * Set up message listener for webview communication
   */
  protected abstract _setWebviewMessageListener(): void;

  /**
   * Dispose of panel resources
   */
  public dispose(): void {
    BaseTicketPanel.currentPanel = undefined;

    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Get URI for a resource in the webview
   */
  protected getUri(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    pathList: string[]
  ): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
  }

  /**
   * Get nonce for CSP
   */
  protected getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

