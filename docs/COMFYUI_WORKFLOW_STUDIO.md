# Aurora Baby Video Agent — ComfyUI Workflow Studio

This agent has its own ComfyUI workflow library, independent from the other two agents.

## Configure

Set `COMFYUI_BASE_URL=http://127.0.0.1:8188` for the API server.

Open the editor's Workflows control and choose **Open Workflow Studio**.

## Workflow lifecycle

1. Import a ComfyUI JSON workflow.
2. Create or edit a workflow in the JSON editor.
3. Save it to this agent's local workflow library.
4. Run it against the configured ComfyUI server.
5. Use the result in the wider production pipeline.

API-format graphs execute directly. Editor-format exports are retained but should be exported as API format from ComfyUI before execution.

## Agent routing

The production graph now contains a dedicated workflow role that can select and parameterize a saved ComfyUI workflow before timeline assembly.
