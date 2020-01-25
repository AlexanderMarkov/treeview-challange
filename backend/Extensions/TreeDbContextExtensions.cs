using System.Threading.Tasks;
using TreeApi.Models;

namespace TreeApi.Extensions
{
	public static class TreeDbContextExtensions
	{
		public static async Task ResetAsync(this TreeDbContext context)
		{
			await context.Database.EnsureDeletedAsync();
			await context.Database.EnsureCreatedAsync();

			var root = new Node
			{
				Name = "Root",
				Children =
				{
					new Node
					{
						Name = "Node 1"
					},
					new Node
					{
						Name = "Node 2",
						Children =
						{
							new Node
							{
								Name = "Node 2.1",
								Children =
								{
									new Node { Name = "Node 2.1.1" },
									new Node { Name = "Node 2.1.2" }
								}
							},
							new Node { Name = "Node 2.2" }
						}
					}
				}
			};

			await context.Nodes.AddAsync(root);
			await context.SaveChangesAsync();
		}
	}
}
